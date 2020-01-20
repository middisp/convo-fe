
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const curRoute = writable('/');
    const user = writable({});
    const isLoggedIn = writable(false);
    const token = writable('');

    /* src\components\Input.svelte generated by Svelte v3.16.7 */
    const file = "src\\components\\Input.svelte";

    function create_fragment(ctx) {
    	let label;
    	let t0;
    	let t1_value = (/*required*/ ctx[5] ? "*" : "") + "";
    	let t1;
    	let label_class_value;
    	let t2;
    	let input;
    	let input_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text(/*labelText*/ ctx[3]);
    			t1 = text(t1_value);
    			t2 = space();
    			input = element("input");
    			attr_dev(label, "class", label_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1lsr13q"));
    			attr_dev(label, "for", /*name*/ ctx[2]);
    			add_location(label, file, 55, 0, 954);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1lsr13q"));
    			attr_dev(input, "name", /*name*/ ctx[2]);
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "id", /*name*/ ctx[2]);
    			attr_dev(input, "type", /*type*/ ctx[4]);
    			input.required = /*required*/ ctx[5];
    			add_location(input, file, 58, 0, 1049);

    			dispose = [
    				listen_dev(input, "input", /*handleInput*/ ctx[6], false, false, false),
    				listen_dev(input, "blur", /*handleBlur*/ ctx[7], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, input, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*labelText*/ 8) set_data_dev(t0, /*labelText*/ ctx[3]);
    			if (dirty & /*required*/ 32 && t1_value !== (t1_value = (/*required*/ ctx[5] ? "*" : "") + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*error*/ 2 && label_class_value !== (label_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1lsr13q"))) {
    				attr_dev(label, "class", label_class_value);
    			}

    			if (dirty & /*name*/ 4) {
    				attr_dev(label, "for", /*name*/ ctx[2]);
    			}

    			if (dirty & /*error*/ 2 && input_class_value !== (input_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1lsr13q"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*name*/ 4) {
    				attr_dev(input, "name", /*name*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 4) {
    				attr_dev(input, "id", /*name*/ ctx[2]);
    			}

    			if (dirty & /*type*/ 16) {
    				attr_dev(input, "type", /*type*/ ctx[4]);
    			}

    			if (dirty & /*required*/ 32) {
    				prop_dev(input, "required", /*required*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(input);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let { labelText } = $$props;
    	let { value } = $$props;
    	let { type = "text" } = $$props;
    	let { error = false } = $$props;
    	let { required } = $$props;

    	const handleInput = e => {
    		$$invalidate(0, value = type.match(/^(number|range)$/)
    		? +e.target.value
    		: e.target.value);
    	};

    	const handleBlur = e => {
    		$$invalidate(1, error = !e.target.value);
    	};

    	const writable_props = ["name", "labelText", "value", "type", "error", "required"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("labelText" in $$props) $$invalidate(3, labelText = $$props.labelText);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    		if ("required" in $$props) $$invalidate(5, required = $$props.required);
    	};

    	$$self.$capture_state = () => {
    		return {
    			name,
    			labelText,
    			value,
    			type,
    			error,
    			required
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("labelText" in $$props) $$invalidate(3, labelText = $$props.labelText);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    		if ("required" in $$props) $$invalidate(5, required = $$props.required);
    	};

    	return [value, error, name, labelText, type, required, handleInput, handleBlur];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			name: 2,
    			labelText: 3,
    			value: 0,
    			type: 4,
    			error: 1,
    			required: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*name*/ ctx[2] === undefined && !("name" in props)) {
    			console.warn("<Input> was created without expected prop 'name'");
    		}

    		if (/*labelText*/ ctx[3] === undefined && !("labelText" in props)) {
    			console.warn("<Input> was created without expected prop 'labelText'");
    		}

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Input> was created without expected prop 'value'");
    		}

    		if (/*required*/ ctx[5] === undefined && !("required" in props)) {
    			console.warn("<Input> was created without expected prop 'required'");
    		}
    	}

    	get name() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Button.svelte generated by Svelte v3.16.7 */
    const file$1 = "src\\components\\Button.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(button, "type", /*type*/ ctx[1]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*klass*/ ctx[3]) + " svelte-jqwqf8"));
    			button.disabled = /*disabled*/ ctx[0];
    			add_location(button, file$1, 35, 0, 640);
    			dispose = listen_dev(button, "click", prevent_default(/*handleClick*/ ctx[4]), false, true, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 4) set_data_dev(t, /*text*/ ctx[2]);

    			if (dirty & /*type*/ 2) {
    				attr_dev(button, "type", /*type*/ ctx[1]);
    			}

    			if (dirty & /*klass*/ 8 && button_class_value !== (button_class_value = "" + (null_to_empty(/*klass*/ ctx[3]) + " svelte-jqwqf8"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*disabled*/ 1) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { disabled = "false" } = $$props;
    	let { type } = $$props;
    	let { text } = $$props;
    	let { klass } = $$props;

    	let { handleClick = () => {
    		dispatch("click");
    	} } = $$props;

    	const writable_props = ["disabled", "type", "text", "klass", "handleClick"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("klass" in $$props) $$invalidate(3, klass = $$props.klass);
    		if ("handleClick" in $$props) $$invalidate(4, handleClick = $$props.handleClick);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, type, text, klass, handleClick };
    	};

    	$$self.$inject_state = $$props => {
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("klass" in $$props) $$invalidate(3, klass = $$props.klass);
    		if ("handleClick" in $$props) $$invalidate(4, handleClick = $$props.handleClick);
    	};

    	return [disabled, type, text, klass, handleClick];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			disabled: 0,
    			type: 1,
    			text: 2,
    			klass: 3,
    			handleClick: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*type*/ ctx[1] === undefined && !("type" in props)) {
    			console.warn("<Button> was created without expected prop 'type'");
    		}

    		if (/*text*/ ctx[2] === undefined && !("text" in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}

    		if (/*klass*/ ctx[3] === undefined && !("klass" in props)) {
    			console.warn("<Button> was created without expected prop 'klass'");
    		}
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get klass() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set klass(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\UserMessage.svelte generated by Svelte v3.16.7 */

    const file$2 = "src\\components\\UserMessage.svelte";

    function create_fragment$2(ctx) {
    	let aside;
    	let button;
    	let t1;
    	let p;
    	let t2_value = /*error*/ ctx[0].statusCode + "";
    	let t2;
    	let t3;
    	let t4_value = (/*error*/ ctx[0].message || /*error*/ ctx[0]) + "";
    	let t4;
    	let aside_class_value;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			button = element("button");
    			button.textContent = "×";
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = text(": ");
    			t4 = text(t4_value);
    			attr_dev(button, "class", "svelte-zzdwcp");
    			add_location(button, file$2, 50, 2, 959);
    			attr_dev(p, "class", "svelte-zzdwcp");
    			add_location(p, file$2, 51, 2, 987);
    			attr_dev(aside, "class", aside_class_value = "" + (null_to_empty(/*klass*/ ctx[1]) + " svelte-zzdwcp"));
    			add_location(aside, file$2, 49, 0, 934);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, button);
    			append_dev(aside, t1);
    			append_dev(aside, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*error*/ 1 && t2_value !== (t2_value = /*error*/ ctx[0].statusCode + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*error*/ 1 && t4_value !== (t4_value = (/*error*/ ctx[0].message || /*error*/ ctx[0]) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*klass*/ 2 && aside_class_value !== (aside_class_value = "" + (null_to_empty(/*klass*/ ctx[1]) + " svelte-zzdwcp"))) {
    				attr_dev(aside, "class", aside_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { error } = $$props;
    	let { klass } = $$props;
    	const writable_props = ["error", "klass"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UserMessage> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("error" in $$props) $$invalidate(0, error = $$props.error);
    		if ("klass" in $$props) $$invalidate(1, klass = $$props.klass);
    	};

    	$$self.$capture_state = () => {
    		return { error, klass };
    	};

    	$$self.$inject_state = $$props => {
    		if ("error" in $$props) $$invalidate(0, error = $$props.error);
    		if ("klass" in $$props) $$invalidate(1, klass = $$props.klass);
    	};

    	return [error, klass];
    }

    class UserMessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { error: 0, klass: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserMessage",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*error*/ ctx[0] === undefined && !("error" in props)) {
    			console.warn("<UserMessage> was created without expected prop 'error'");
    		}

    		if (/*klass*/ ctx[1] === undefined && !("klass" in props)) {
    			console.warn("<UserMessage> was created without expected prop 'klass'");
    		}
    	}

    	get error() {
    		throw new Error("<UserMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<UserMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get klass() {
    		throw new Error("<UserMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set klass(value) {
    		throw new Error("<UserMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Views\Login.svelte generated by Svelte v3.16.7 */
    const file$3 = "src\\Views\\Login.svelte";

    // (49:0) {#if error}
    function create_if_block(ctx) {
    	let current;

    	const usermessage = new UserMessage({
    			props: {
    				klass: "error",
    				error: /*error*/ ctx[2],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(usermessage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(usermessage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const usermessage_changes = {};
    			if (dirty & /*error*/ 4) usermessage_changes.error = /*error*/ ctx[2];

    			if (dirty & /*$$scope, error*/ 132) {
    				usermessage_changes.$$scope = { dirty, ctx };
    			}

    			usermessage.$set(usermessage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(usermessage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(usermessage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(usermessage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(49:0) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (50:2) <UserMessage klass="error" {error}>
    function create_default_slot(ctx) {
    	let t_value = (/*error*/ ctx[2].message || /*error*/ ctx[2]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 4 && t_value !== (t_value = (/*error*/ ctx[2].message || /*error*/ ctx[2]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(50:2) <UserMessage klass=\\\"error\\\" {error}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let t0;
    	let h1;
    	let t2;
    	let form;
    	let updating_value;
    	let t3;
    	let updating_value_1;
    	let t4;
    	let current;
    	let if_block = /*error*/ ctx[2] && create_if_block(ctx);

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[5].call(null, value);
    	}

    	let input0_props = {
    		type: "text",
    		name: "email",
    		labelText: "Email",
    		required: "required"
    	};

    	if (/*email*/ ctx[0] !== void 0) {
    		input0_props.value = /*email*/ ctx[0];
    	}

    	const input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value_1) {
    		/*input1_value_binding*/ ctx[6].call(null, value_1);
    	}

    	let input1_props = {
    		type: "password",
    		name: "password",
    		labelText: "Password",
    		required: "required"
    	};

    	if (/*password*/ ctx[1] !== void 0) {
    		input1_props.value = /*password*/ ctx[1];
    	}

    	const input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	const button = new Button({
    			props: {
    				type: "submit",
    				disabled: !/*email*/ ctx[0].length || !/*password*/ ctx[1].length,
    				klass: "primary",
    				text: "Login"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*login*/ ctx[3]);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Hi!";
    			t2 = space();
    			form = element("form");
    			create_component(input0.$$.fragment);
    			t3 = space();
    			create_component(input1.$$.fragment);
    			t4 = space();
    			create_component(button.$$.fragment);
    			add_location(h1, file$3, 51, 0, 1377);
    			attr_dev(form, "action", "post");
    			add_location(form, file$3, 52, 0, 1391);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, form, anchor);
    			mount_component(input0, form, null);
    			append_dev(form, t3);
    			mount_component(input1, form, null);
    			append_dev(form, t4);
    			mount_component(button, form, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*error*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const input0_changes = {};

    			if (!updating_value && dirty & /*email*/ 1) {
    				updating_value = true;
    				input0_changes.value = /*email*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*password*/ 2) {
    				updating_value_1 = true;
    				input1_changes.value = /*password*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const button_changes = {};
    			if (dirty & /*email, password*/ 3) button_changes.disabled = !/*email*/ ctx[0].length || !/*password*/ ctx[1].length;
    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(form);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let email = "";
    	let password = "";
    	let error;

    	const saveToSession = data => {
    		window.sessionStorage.setItem("token", data);
    	};

    	const login = () => {
    		if (!email || !password) {
    			return $$invalidate(2, error = "Please provide your login details");
    		}

    		fetch("http://localhost:3000/login", {
    			method: "post",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ email, password })
    		}).then(res => res.json()).then(result => {
    			console.log(result);

    			if (result.statusCode) {
    				$$invalidate(2, error = result);
    			} else {
    				user.set(result.user);
    				isLoggedIn.set(true);
    				curRoute.set("/threads");
    				token.set(result.token);
    				window.history.pushState({ path: "/threads" }, "", window.location.origin + "/threads");
    			}
    		}).catch(e => {
    			$$invalidate(2, error = e);
    			console.log(e);
    		});
    	};

    	function input0_value_binding(value) {
    		email = value;
    		$$invalidate(0, email);
    	}

    	function input1_value_binding(value_1) {
    		password = value_1;
    		$$invalidate(1, password);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    		if ("error" in $$props) $$invalidate(2, error = $$props.error);
    	};

    	return [
    		email,
    		password,
    		error,
    		login,
    		saveToSession,
    		input0_value_binding,
    		input1_value_binding
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Views\Threads.svelte generated by Svelte v3.16.7 */
    const file$4 = "src\\Views\\Threads.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (35:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No threads";
    			add_location(p, file$4, 35, 2, 742);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(35:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (31:0) {#if threads.length}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*threads*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*threads*/ 1) {
    				each_value = /*threads*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(31:0) {#if threads.length}",
    		ctx
    	});

    	return block;
    }

    // (32:2) {#each threads as thread}
    function create_each_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*thread*/ ctx[3]._id + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Thread - ");
    			t1 = text(t1_value);
    			add_location(p, file$4, 32, 4, 690);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*threads*/ 1 && t1_value !== (t1_value = /*thread*/ ctx[3]._id + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(32:2) {#each threads as thread}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let h1;
    	let t1;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*threads*/ ctx[0].length) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Threads";
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h1, file$4, 28, 0, 615);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $user;
    	let $token;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(1, $user = $$value));
    	validate_store(token, "token");
    	component_subscribe($$self, token, $$value => $$invalidate(2, $token = $$value));
    	let threads = [];

    	onMount(() => {
    		fetch(`http://localhost:3000/thread/${$user._id}`, {
    			method: "get",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			}
    		}).then(res => res.json()).then(result => {
    			console.log(result);

    			if (result.statusCode) {
    				error = result;
    			} else {
    				$$invalidate(0, threads = result);
    			}
    		}).catch(e => console.log(e));
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("threads" in $$props) $$invalidate(0, threads = $$props.threads);
    		if ("$user" in $$props) user.set($user = $$props.$user);
    		if ("$token" in $$props) token.set($token = $$props.$token);
    	};

    	return [threads];
    }

    class Threads extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Threads",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\About.svelte generated by Svelte v3.16.7 */

    const file$5 = "src\\About.svelte";

    function create_fragment$5(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "About page";
    			add_location(h1, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const router = {
      '/': {
        view: Login,
        title: 'Login'
      },
      '/threads': {
        view: Threads,
        title: 'Threads'
      },
      '/about': {
        view: About,
        title: 'About'
      }
    };

    /* src\components\Header.svelte generated by Svelte v3.16.7 */

    const file$6 = "src\\components\\Header.svelte";

    // (82:2) {#if showNav}
    function create_if_block$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Menu";
    			attr_dev(button, "class", "svelte-19yig74");
    			add_location(button, file$6, 82, 4, 1464);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(82:2) {#if showNav}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let header;
    	let h1;
    	let t0;
    	let span3;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let span2;
    	let t3;
    	let if_block = /*showNav*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t0 = text("Convo\r\n    ");
    			span3 = element("span");
    			span0 = element("span");
    			t1 = space();
    			span1 = element("span");
    			t2 = space();
    			span2 = element("span");
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "dot dot-one svelte-19yig74");
    			add_location(span0, file$6, 76, 6, 1317);
    			attr_dev(span1, "class", "dot dot-two svelte-19yig74");
    			add_location(span1, file$6, 77, 6, 1353);
    			attr_dev(span2, "class", "dot dot-three svelte-19yig74");
    			add_location(span2, file$6, 78, 6, 1389);
    			attr_dev(span3, "class", "dotAnim svelte-19yig74");
    			add_location(span3, file$6, 75, 4, 1287);
    			attr_dev(h1, "class", "svelte-19yig74");
    			add_location(h1, file$6, 73, 2, 1266);
    			attr_dev(header, "class", "svelte-19yig74");
    			add_location(header, file$6, 72, 0, 1254);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span3);
    			append_dev(span3, span0);
    			append_dev(span3, t1);
    			append_dev(span3, span1);
    			append_dev(span3, t2);
    			append_dev(span3, span2);
    			append_dev(header, t3);
    			if (if_block) if_block.m(header, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showNav*/ ctx[0]) {
    				if (!if_block) {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(header, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { showNav = false } = $$props;
    	const writable_props = ["showNav"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("showNav" in $$props) $$invalidate(0, showNav = $$props.showNav);
    	};

    	$$self.$capture_state = () => {
    		return { showNav };
    	};

    	$$self.$inject_state = $$props => {
    		if ("showNav" in $$props) $$invalidate(0, showNav = $$props.showNav);
    	};

    	return [showNav];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, { showNav: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get showNav() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showNav(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\RouterLink.svelte generated by Svelte v3.16.7 */
    const file$7 = "src\\components\\RouterLink.svelte";

    function create_fragment$7(ctx) {
    	let a;
    	let t_value = /*page*/ ctx[0].name + "";
    	let t;
    	let a_href_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*page*/ ctx[0].path);
    			add_location(a, file$7, 18, 0, 335);
    			dispose = listen_dev(a, "click", prevent_default(/*navigateTo*/ ctx[1]), false, true, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*page*/ 1 && t_value !== (t_value = /*page*/ ctx[0].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*page*/ 1 && a_href_value !== (a_href_value = /*page*/ ctx[0].path)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { page = { path: "/", name: "Login" } } = $$props;

    	const navigateTo = event => {
    		curRoute.set(event.target.pathname);
    		window.history.pushState({ path: page.path }, "", window.location.origin + page.path);
    	};

    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouterLink> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => {
    		return { page };
    	};

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	return [page, navigateTo];
    }

    class RouterLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouterLink",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get page() {
    		throw new Error("<RouterLink>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<RouterLink>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Navigation.svelte generated by Svelte v3.16.7 */
    const file$8 = "src\\components\\Navigation.svelte";

    function create_fragment$8(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let t;
    	let li1;
    	let current;

    	const routerlink0 = new RouterLink({
    			props: { page: { path: "/home", name: "Home" } },
    			$$inline: true
    		});

    	const routerlink1 = new RouterLink({
    			props: { page: { path: "/about", name: "About" } },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			create_component(routerlink0.$$.fragment);
    			t = space();
    			li1 = element("li");
    			create_component(routerlink1.$$.fragment);
    			add_location(li0, file$8, 32, 4, 613);
    			add_location(li1, file$8, 35, 4, 695);
    			attr_dev(ul, "class", "svelte-1tb4sqe");
    			add_location(ul, file$8, 31, 2, 603);
    			add_location(nav, file$8, 30, 0, 594);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			mount_component(routerlink0, li0, null);
    			append_dev(ul, t);
    			append_dev(ul, li1);
    			mount_component(routerlink1, li1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerlink0.$$.fragment, local);
    			transition_in(routerlink1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerlink0.$$.fragment, local);
    			transition_out(routerlink1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(routerlink0);
    			destroy_component(routerlink1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self) {
    	onMount(() => {
    		curRoute.set(window.location.pathname);

    		if (!history.state) {
    			window.history.replaceState({ path: window.location.pathname }, "", window.location.href);
    		}
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.16.7 */

    const { window: window_1 } = globals;
    const file$9 = "src\\App.svelte";

    // (40:0) {#if $isLoggedIn}
    function create_if_block$3(ctx) {
    	let current;
    	const navigation = new Navigation({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navigation.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navigation, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navigation, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(40:0) {#if $isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let title_value;
    	let t0;
    	let t1;
    	let t2;
    	let main;
    	let current;
    	let dispose;
    	document.title = title_value = "Convo - " + router[/*$curRoute*/ ctx[0]].title;

    	const header = new Header({
    			props: { showNav: /*$isLoggedIn*/ ctx[1] },
    			$$inline: true
    		});

    	let if_block = /*$isLoggedIn*/ ctx[1] && create_if_block$3(ctx);
    	var switch_value = router[/*$curRoute*/ ctx[0]].view;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(main, "id", "pageContent");
    			add_location(main, file$9, 42, 0, 1085);

    			dispose = [
    				listen_dev(window_1, "popstate", /*handleBackNavigation*/ ctx[2], false, false, false),
    				listen_dev(window_1, "storage", /*syncLogOut*/ ctx[3], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*router, $curRoute*/ 1) && title_value !== (title_value = "Convo - " + router[/*$curRoute*/ ctx[0]].title)) {
    				document.title = title_value;
    			}

    			const header_changes = {};
    			if (dirty & /*$isLoggedIn*/ 2) header_changes.showNav = /*$isLoggedIn*/ ctx[1];
    			header.$set(header_changes);

    			if (/*$isLoggedIn*/ ctx[1]) {
    				if (!if_block) {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t2.parentNode, t2);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (switch_value !== (switch_value = router[/*$curRoute*/ ctx[0]].view)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $curRoute;
    	let $isLoggedIn;
    	validate_store(curRoute, "curRoute");
    	component_subscribe($$self, curRoute, $$value => $$invalidate(0, $curRoute = $$value));
    	validate_store(isLoggedIn, "isLoggedIn");
    	component_subscribe($$self, isLoggedIn, $$value => $$invalidate(1, $isLoggedIn = $$value));

    	onMount(() => {
    		curRoute.set(window.location.pathname);

    		if (!history.state) {
    			window.history.replaceState({ path: window.location.pathname }, "", window.location.href);
    		}
    	});

    	const handleBackNavigation = event => {
    		curRoute.set(event.state.path);
    	};

    	const syncLogOut = evt => {
    		if (evt.key === "logout") {
    			console.log("logged out from storage!");
    			curRoute.set("/");
    			window.history.pushState({ path: "/" }, "", window.location.origin + "/");
    		}
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$curRoute" in $$props) curRoute.set($curRoute = $$props.$curRoute);
    		if ("$isLoggedIn" in $$props) isLoggedIn.set($isLoggedIn = $$props.$isLoggedIn);
    	};

    	return [$curRoute, $isLoggedIn, handleBackNavigation, syncLogOut];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
