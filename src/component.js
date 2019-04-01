import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as BaseCommands from './commands';
import Fish from './fish';
import Styles from './styles';

const CTRL_CHAR_CODE = 17;
const L_CHAR_CODE = 76;
const C_CHAR_CODE = 67;
const UP_CHAR_CODE = 38;
const DOWN_CHAR_CODE = 40;
const TAB_CHAR_CODE = 9;
const noop = () => {};

export default class Terminal extends Component {

    constructor({ history, structure, extensions, settings }) {
        super();
        this.Fish = new Fish(extensions);
        this.ctrlPressed = false;
        this.state = {
            settings,
            history: history.slice(),
            structure: Object.assign({}, structure),
            cwd: '',
        };
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    componentDidMount() {
        this.refs.input.focus();
    }

    componentWillReceiveProps({ extensions, structure, history }) {
        const updatedState = {};
        if (structure) {
            updatedState.structure = Object.assign({}, structure);
        }
        if (history) {
            updatedState.history = history.slice();
        }
        if (extensions) {
            this.Fish.commands = Object.assign({}, BaseCommands, extensions);
        }
        this.setState(updatedState);
    }

    /*
     * Utilize immutability
     */
    shouldComponentUpdate(nextProps, nextState) {
        return (this.state !== nextState) || (this.props !== nextProps);
    }

    /*
     * Keep input in view on change
     */
    componentDidUpdate() {
        this.refs.input.scrollIntoView();
    }

    /*
     * Forward the input along to the Fish autocompleter. If it works,
     * update the input.
     */
    attemptAutocomplete() {
        const input = this.refs.input.value;
        const suggestion = this.Fish.autocomplete(input, this.state);
        if (suggestion) {
            this.refs.input.value = suggestion;
        }
    }

    /*
     * Handle keydown for special hot keys. The tab key
     * has to be handled on key down to prevent default.
     * @param {Event} evt - the DOM event
     */
    handleKeyDown(evt) {
        if (evt.which === CTRL_CHAR_CODE) {
            this.ctrlPressed = true;
        } else if (evt.which === TAB_CHAR_CODE) {
            // Tab must be on keydown to prevent default
            this.attemptAutocomplete();
            evt.preventDefault();
        }
    }

    /*
     * Handle keyup for special hot keys.
     * @param {Event} evt - the DOM event
     *
     * -- Supported hot keys --
     * ctrl + l : clear
     * ctrl + c : cancel current command
     * up - prev command from history
     * down - next command from history
     * tab - autocomplete
     */
    handleKeyUp(evt) {
        if (evt.which === L_CHAR_CODE) {
            if (this.ctrlPressed) {
                this.setState(this.Fish.execute('clear', this.state));
            }
        } else if (evt.which === C_CHAR_CODE) {
            if (this.ctrlPressed) {
                this.refs.input.value = '';
            }
        } else if (evt.which === UP_CHAR_CODE) {
            if (this.Fish.hasPrevCommand()) {
                this.refs.input.value = this.Fish.getPrevCommand();
            }
        } else if (evt.which === DOWN_CHAR_CODE) {
            if (this.Fish.hasNextCommand()) {
                this.refs.input.value = this.Fish.getNextCommand();
            } else {
                this.refs.input.value = '';
            }
        } else if (evt.which === CTRL_CHAR_CODE) {
            this.ctrlPressed = false;
        }
    }

    handleSubmit(evt) {
        evt.preventDefault();

        // Execute command
        const input = evt.target[0].value;
        const newState = this.Fish.execute(input, this.state);
        this.setState(newState);
        this.refs.input.value = '';
    }

    renderHistoryItem(style) {
        return (item, key) => {
            const prefix = item.hasOwnProperty('cwd') ? (
                <span style={style.prefix}>{`${this.props.prefix} ~${item.cwd} $`}</span>
            ) : undefined;
            return <div data-test-id={`history-${key}`} key={key} >{prefix}{item.value}</div>;
        };
    }

    render() {
        const { onClose, onExpand, onMinimize, prefix, styles, theme } = this.props;
        const { history, cwd } = this.state;
        const style = Object.assign({}, Styles[theme] || Styles.light, styles);
        return (
            <div className="ReactFish" style={style.ReactFish}>
                <div style={style.header}>
                    <span style={style.redCircle} onClick={onClose}></span>
                    <span style={style.yellowCircle} onClick={onMinimize}></span>
                    <span style={style.greenCircle} onClick={onExpand}></span>
                </div>
                <div style={style.body} onClick={() => this.refs.input.focus()}>
                    {history.map(this.renderHistoryItem(style))}
                    <form onSubmit={evt => this.handleSubmit(evt)} style={style.form}>
                        <span style={style.prefix}>{`${prefix} ~${cwd} $`}</span>
                        <input
                          autoComplete="off"
                          autoCapitalize="off"
                          onKeyDown={this.handleKeyDown}
                          onKeyUp={this.handleKeyUp}
                          ref="input"
                          style={style.input}
                        />
                    </form>
                </div>
            </div>
        );
    }
}

Terminal.Themes = {
    LIGHT: 'light',
    DARK: 'dark',
    SOLARIZED: 'solarized',
};

Terminal.propTypes = {
    extensions: PropTypes.object,
    history: PropTypes.array,
    onClose: PropTypes.func,
    onExpand: PropTypes.func,
    onMinimize: PropTypes.func,
    prefix: PropTypes.string,
    structure: PropTypes.object,
    styles: PropTypes.object,
    theme: PropTypes.string,
    settings: PropTypes.object,
};

Terminal.defaultProps = {
    extensions: {},
    history: [],
    onClose: noop,
    onExpand: noop,
    onMinimize: noop,
    prefix: 'hacker@default',
    structure: {},
    styles: {},
    theme: Terminal.Themes.LIGHT,
};
