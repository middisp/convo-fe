
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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
    			add_location(label, file, 55, 0, 935);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1lsr13q"));
    			attr_dev(input, "name", /*name*/ ctx[2]);
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "id", /*name*/ ctx[2]);
    			attr_dev(input, "type", /*type*/ ctx[4]);
    			input.required = /*required*/ ctx[5];
    			input.disabled = /*disabled*/ ctx[6];
    			add_location(input, file, 58, 0, 1030);

    			dispose = [
    				listen_dev(input, "input", /*handleInput*/ ctx[7], false, false, false),
    				listen_dev(input, "blur", /*handleBlur*/ ctx[8], false, false, false)
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

    			if (dirty & /*disabled*/ 64) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[6]);
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
    	let { disabled = false } = $$props;

    	const handleInput = e => {
    		$$invalidate(0, value = type.match(/^(number|range)$/)
    		? +e.target.value
    		: e.target.value);
    	};

    	const handleBlur = e => {
    		$$invalidate(1, error = !e.target.value);
    	};

    	const writable_props = ["name", "labelText", "value", "type", "error", "required", "disabled"];

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
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return {
    			name,
    			labelText,
    			value,
    			type,
    			error,
    			required,
    			disabled
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    		if ("labelText" in $$props) $$invalidate(3, labelText = $$props.labelText);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    		if ("required" in $$props) $$invalidate(5, required = $$props.required);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    	};

    	return [
    		value,
    		error,
    		name,
    		labelText,
    		type,
    		required,
    		disabled,
    		handleInput,
    		handleBlur
    	];
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
    			required: 5,
    			disabled: 6
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

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
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
    			add_location(button, file$1, 35, 0, 638);
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
    	let { disabled = false } = $$props;
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

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
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
    	let aside_transition;
    	let current;

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
    			attr_dev(button, "class", "svelte-97d0yc");
    			add_location(button, file$2, 46, 2, 857);
    			attr_dev(p, "class", "svelte-97d0yc");
    			add_location(p, file$2, 47, 2, 885);
    			attr_dev(aside, "class", aside_class_value = "" + (null_to_empty(/*klass*/ ctx[1]) + " svelte-97d0yc"));
    			add_location(aside, file$2, 45, 0, 816);
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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*error*/ 1) && t2_value !== (t2_value = /*error*/ ctx[0].statusCode + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*error*/ 1) && t4_value !== (t4_value = (/*error*/ ctx[0].message || /*error*/ ctx[0]) + "")) set_data_dev(t4, t4_value);

    			if (!current || dirty & /*klass*/ 2 && aside_class_value !== (aside_class_value = "" + (null_to_empty(/*klass*/ ctx[1]) + " svelte-97d0yc"))) {
    				attr_dev(aside, "class", aside_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!aside_transition) aside_transition = create_bidirectional_transition(aside, fade, {}, true);
    				aside_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!aside_transition) aside_transition = create_bidirectional_transition(aside, fade, {}, false);
    			aside_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			if (detaching && aside_transition) aside_transition.end();
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

    // (48:0) {#if error}
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
    		source: "(48:0) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (49:2) <UserMessage klass="error" {error}>
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
    		source: "(49:2) <UserMessage klass=\\\"error\\\" {error}>",
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
    			add_location(h1, file$3, 50, 0, 1347);
    			attr_dev(form, "action", "post");
    			add_location(form, file$3, 51, 0, 1361);
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

    // (34:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No threads";
    			add_location(p, file$4, 34, 2, 712);
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
    		source: "(34:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:0) {#if threads.length}
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
    		source: "(30:0) {#if threads.length}",
    		ctx
    	});

    	return block;
    }

    // (31:2) {#each threads as thread}
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
    			add_location(p, file$4, 31, 4, 660);
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
    		source: "(31:2) {#each threads as thread}",
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
    			add_location(h1, file$4, 27, 0, 585);
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

    /* src\components\Toggle.svelte generated by Svelte v3.16.7 */

    const file$5 = "src\\components\\Toggle.svelte";

    function create_fragment$5(ctx) {
    	let input;
    	let t0;
    	let label;
    	let t1;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(/*labelText*/ ctx[2]);
    			attr_dev(input, "name", /*name*/ ctx[1]);
    			attr_dev(input, "id", /*name*/ ctx[1]);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-1g1xjfv");
    			add_location(input, file$5, 61, 0, 1109);
    			attr_dev(label, "for", /*name*/ ctx[1]);
    			attr_dev(label, "class", "svelte-1g1xjfv");
    			add_location(label, file$5, 62, 0, 1174);
    			dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			input.checked = /*value*/ ctx[0];
    			insert_dev(target, t0, anchor);
    			insert_dev(target, label, anchor);
    			append_dev(label, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 2) {
    				attr_dev(input, "name", /*name*/ ctx[1]);
    			}

    			if (dirty & /*name*/ 2) {
    				attr_dev(input, "id", /*name*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1) {
    				input.checked = /*value*/ ctx[0];
    			}

    			if (dirty & /*labelText*/ 4) set_data_dev(t1, /*labelText*/ ctx[2]);

    			if (dirty & /*name*/ 2) {
    				attr_dev(label, "for", /*name*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(label);
    			dispose();
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let { labelText } = $$props;
    	let { value = false } = $$props;
    	const writable_props = ["name", "labelText", "value"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Toggle> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		value = this.checked;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("labelText" in $$props) $$invalidate(2, labelText = $$props.labelText);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { name, labelText, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("labelText" in $$props) $$invalidate(2, labelText = $$props.labelText);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    	};

    	return [value, name, labelText, input_change_handler];
    }

    class Toggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { name: 1, labelText: 2, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggle",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console.warn("<Toggle> was created without expected prop 'name'");
    		}

    		if (/*labelText*/ ctx[2] === undefined && !("labelText" in props)) {
    			console.warn("<Toggle> was created without expected prop 'labelText'");
    		}
    	}

    	get name() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelText() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelText(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Views\Profile.svelte generated by Svelte v3.16.7 */
    const file$6 = "src\\Views\\Profile.svelte";

    // (94:0) {#if $user}
    function create_if_block$2(ctx) {
    	let t0;
    	let form0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t1;
    	let updating_value;
    	let t2;
    	let updating_value_1;
    	let t3;
    	let updating_value_2;
    	let t4;
    	let t5;
    	let form1;
    	let legend;
    	let t7;
    	let updating_value_3;
    	let t8;
    	let updating_value_4;
    	let t9;
    	let updating_value_5;
    	let t10;
    	let current;
    	let if_block0 = /*error*/ ctx[4] && create_if_block_2(ctx);

    	function toggle_value_binding(value) {
    		/*toggle_value_binding*/ ctx[10].call(null, value);
    	}

    	let toggle_props = { name: "edit", labelText: "Edit" };

    	if (/*isEditable*/ ctx[0] !== void 0) {
    		toggle_props.value = /*isEditable*/ ctx[0];
    	}

    	const toggle = new Toggle({ props: toggle_props, $$inline: true });
    	binding_callbacks.push(() => bind(toggle, "value", toggle_value_binding));

    	function input0_value_binding(value_1) {
    		/*input0_value_binding*/ ctx[11].call(null, value_1);
    	}

    	let input0_props = {
    		type: "text",
    		name: "name",
    		labelText: "Name",
    		disabled: !/*isEditable*/ ctx[0],
    		required: false
    	};

    	if (/*updatedUser*/ ctx[5].name !== void 0) {
    		input0_props.value = /*updatedUser*/ ctx[5].name;
    	}

    	const input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value_2) {
    		/*input1_value_binding*/ ctx[12].call(null, value_2);
    	}

    	let input1_props = {
    		type: "text",
    		name: "email",
    		labelText: "Email",
    		disabled: !/*isEditable*/ ctx[0],
    		required: false
    	};

    	if (/*updatedUser*/ ctx[5].email !== void 0) {
    		input1_props.value = /*updatedUser*/ ctx[5].email;
    	}

    	const input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));
    	let if_block1 = /*isEditable*/ ctx[0] && create_if_block_1(ctx);

    	function input2_value_binding(value_3) {
    		/*input2_value_binding*/ ctx[13].call(null, value_3);
    	}

    	let input2_props = {
    		type: "password",
    		name: "password",
    		labelText: "Current Password",
    		required: true
    	};

    	if (/*currentPassword*/ ctx[1] !== void 0) {
    		input2_props.value = /*currentPassword*/ ctx[1];
    	}

    	const input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value_4) {
    		/*input3_value_binding*/ ctx[14].call(null, value_4);
    	}

    	let input3_props = {
    		type: "password",
    		name: "new-password",
    		labelText: "New Password",
    		required: true
    	};

    	if (/*newPassword*/ ctx[2] !== void 0) {
    		input3_props.value = /*newPassword*/ ctx[2];
    	}

    	const input3 = new Input({ props: input3_props, $$inline: true });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value_5) {
    		/*input4_value_binding*/ ctx[15].call(null, value_5);
    	}

    	let input4_props = {
    		type: "password",
    		name: "c-password",
    		labelText: "Confirm New Password",
    		required: true
    	};

    	if (/*confNewPassword*/ ctx[3] !== void 0) {
    		input4_props.value = /*confNewPassword*/ ctx[3];
    	}

    	const input4 = new Input({ props: input4_props, $$inline: true });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	const button = new Button({
    			props: {
    				type: "submit",
    				klass: "primary",
    				text: "Save"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updatePassword*/ ctx[8]);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			form0 = element("form");
    			img = element("img");
    			t1 = space();
    			create_component(toggle.$$.fragment);
    			t2 = space();
    			create_component(input0.$$.fragment);
    			t3 = space();
    			create_component(input1.$$.fragment);
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			form1 = element("form");
    			legend = element("legend");
    			legend.textContent = "Password management";
    			t7 = space();
    			create_component(input2.$$.fragment);
    			t8 = space();
    			create_component(input3.$$.fragment);
    			t9 = space();
    			create_component(input4.$$.fragment);
    			t10 = space();
    			create_component(button.$$.fragment);
    			if (img.src !== (img_src_value = "/images/default-avatar.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*updatedUser*/ ctx[5].name);
    			attr_dev(img, "class", "svelte-1v6aass");
    			add_location(img, file$6, 98, 4, 2425);
    			attr_dev(form0, "class", "userDetails svelte-1v6aass");
    			add_location(form0, file$6, 97, 2, 2393);
    			add_location(legend, file$6, 122, 4, 3065);
    			attr_dev(form1, "class", "passwordManagement svelte-1v6aass");
    			add_location(form1, file$6, 121, 2, 3026);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, form0, anchor);
    			append_dev(form0, img);
    			append_dev(form0, t1);
    			mount_component(toggle, form0, null);
    			append_dev(form0, t2);
    			mount_component(input0, form0, null);
    			append_dev(form0, t3);
    			mount_component(input1, form0, null);
    			append_dev(form0, t4);
    			if (if_block1) if_block1.m(form0, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, form1, anchor);
    			append_dev(form1, legend);
    			append_dev(form1, t7);
    			mount_component(input2, form1, null);
    			append_dev(form1, t8);
    			mount_component(input3, form1, null);
    			append_dev(form1, t9);
    			mount_component(input4, form1, null);
    			append_dev(form1, t10);
    			mount_component(button, form1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*error*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*updatedUser*/ 32 && img_alt_value !== (img_alt_value = /*updatedUser*/ ctx[5].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			const toggle_changes = {};

    			if (!updating_value && dirty & /*isEditable*/ 1) {
    				updating_value = true;
    				toggle_changes.value = /*isEditable*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			toggle.$set(toggle_changes);
    			const input0_changes = {};
    			if (dirty & /*isEditable*/ 1) input0_changes.disabled = !/*isEditable*/ ctx[0];

    			if (!updating_value_1 && dirty & /*updatedUser*/ 32) {
    				updating_value_1 = true;
    				input0_changes.value = /*updatedUser*/ ctx[5].name;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};
    			if (dirty & /*isEditable*/ 1) input1_changes.disabled = !/*isEditable*/ ctx[0];

    			if (!updating_value_2 && dirty & /*updatedUser*/ 32) {
    				updating_value_2 = true;
    				input1_changes.value = /*updatedUser*/ ctx[5].email;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input1.$set(input1_changes);

    			if (/*isEditable*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(form0, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			const input2_changes = {};

    			if (!updating_value_3 && dirty & /*currentPassword*/ 2) {
    				updating_value_3 = true;
    				input2_changes.value = /*currentPassword*/ ctx[1];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_4 && dirty & /*newPassword*/ 4) {
    				updating_value_4 = true;
    				input3_changes.value = /*newPassword*/ ctx[2];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_5 && dirty & /*confNewPassword*/ 8) {
    				updating_value_5 = true;
    				input4_changes.value = /*confNewPassword*/ ctx[3];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input4.$set(input4_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(toggle.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(toggle.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(form0);
    			destroy_component(toggle);
    			destroy_component(input0);
    			destroy_component(input1);
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(form1);
    			destroy_component(input2);
    			destroy_component(input3);
    			destroy_component(input4);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(94:0) {#if $user}",
    		ctx
    	});

    	return block;
    }

    // (95:2) {#if error}
    function create_if_block_2(ctx) {
    	let current;

    	const usermessage = new UserMessage({
    			props: {
    				klass: "error",
    				error: /*error*/ ctx[4],
    				$$slots: { default: [create_default_slot$1] },
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
    			if (dirty & /*error*/ 16) usermessage_changes.error = /*error*/ ctx[4];

    			if (dirty & /*$$scope, error*/ 65552) {
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(95:2) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (96:4) <UserMessage klass="error" {error}>
    function create_default_slot$1(ctx) {
    	let t_value = (/*error*/ ctx[4].message || /*error*/ ctx[4]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 16 && t_value !== (t_value = (/*error*/ ctx[4].message || /*error*/ ctx[4]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(96:4) <UserMessage klass=\\\"error\\\" {error}>",
    		ctx
    	});

    	return block;
    }

    // (117:4) {#if isEditable}
    function create_if_block_1(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				type: "submit",
    				klass: "primary",
    				text: "Save"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*save*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(117:4) {#if isEditable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$user*/ ctx[6] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$user*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let $user;
    	let $token;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(6, $user = $$value));
    	validate_store(token, "token");
    	component_subscribe($$self, token, $$value => $$invalidate(9, $token = $$value));
    	let isEditable;
    	let currentPassword = "";
    	let newPassword = "";
    	let confNewPassword = "";
    	let error;
    	let updatedUser = $user;

    	const save = () => {
    		fetch(`http://localhost:3000/user/update/${updatedUser._id}`, {
    			method: "put",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			},
    			body: JSON.stringify(updatedUser)
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				$$invalidate(4, error = result);
    			}

    			user.update(result => result);
    		}).catch(e => {
    			$$invalidate(4, error = e);
    			console.log(e);
    		});
    	};

    	const updatePassword = () => {
    		if (!currentPassword || !newPassword || !confNewPassword) {
    			return $$invalidate(4, error = "Please provide passwords");
    		}

    		if (newPassword !== confNewPassword) {
    			return $$invalidate(4, error = "Passwords don't match");
    		}

    		fetch(`http://localhost:3000/login/updatePassword/${$user._id}`, {
    			method: "put",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			},
    			body: JSON.stringify({ currentPassword, newPassword })
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				$$invalidate(4, error = result);
    			}

    			user.update(result => result);
    		}).catch(e => {
    			$$invalidate(4, error = e);
    			console.log(e);
    		});
    	};

    	function toggle_value_binding(value) {
    		isEditable = value;
    		$$invalidate(0, isEditable);
    	}

    	function input0_value_binding(value_1) {
    		updatedUser.name = value_1;
    		$$invalidate(5, updatedUser);
    	}

    	function input1_value_binding(value_2) {
    		updatedUser.email = value_2;
    		$$invalidate(5, updatedUser);
    	}

    	function input2_value_binding(value_3) {
    		currentPassword = value_3;
    		$$invalidate(1, currentPassword);
    	}

    	function input3_value_binding(value_4) {
    		newPassword = value_4;
    		$$invalidate(2, newPassword);
    	}

    	function input4_value_binding(value_5) {
    		confNewPassword = value_5;
    		$$invalidate(3, confNewPassword);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("isEditable" in $$props) $$invalidate(0, isEditable = $$props.isEditable);
    		if ("currentPassword" in $$props) $$invalidate(1, currentPassword = $$props.currentPassword);
    		if ("newPassword" in $$props) $$invalidate(2, newPassword = $$props.newPassword);
    		if ("confNewPassword" in $$props) $$invalidate(3, confNewPassword = $$props.confNewPassword);
    		if ("error" in $$props) $$invalidate(4, error = $$props.error);
    		if ("updatedUser" in $$props) $$invalidate(5, updatedUser = $$props.updatedUser);
    		if ("$user" in $$props) user.set($user = $$props.$user);
    		if ("$token" in $$props) token.set($token = $$props.$token);
    	};

    	return [
    		isEditable,
    		currentPassword,
    		newPassword,
    		confNewPassword,
    		error,
    		updatedUser,
    		$user,
    		save,
    		updatePassword,
    		$token,
    		toggle_value_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding
    	];
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Profile",
    			options,
    			id: create_fragment$6.name
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
      '/profile': {
        view: Profile,
        title: 'Profile'
      }
    };

    /* src\components\Header.svelte generated by Svelte v3.16.7 */

    const file$7 = "src\\components\\Header.svelte";

    // (124:2) {#if showNav}
    function create_if_block$3(ctx) {
    	let button;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let button_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "bar bar-one svelte-15qcjnw");
    			add_location(div0, file$7, 125, 6, 2328);
    			attr_dev(div1, "class", "bar bar-two svelte-15qcjnw");
    			add_location(div1, file$7, 126, 6, 2363);
    			attr_dev(div2, "class", "bar bar-three svelte-15qcjnw");
    			add_location(div2, file$7, 127, 6, 2398);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*toggleNav*/ ctx[0] ? "open" : "") + " svelte-15qcjnw"));
    			add_location(button, file$7, 124, 4, 2257);
    			dispose = listen_dev(button, "click", /*handleClick*/ ctx[2], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, div0);
    			append_dev(button, t0);
    			append_dev(button, div1);
    			append_dev(button, t1);
    			append_dev(button, div2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*toggleNav*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*toggleNav*/ ctx[0] ? "open" : "") + " svelte-15qcjnw"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(124:2) {#if showNav}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
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
    	let if_block = /*showNav*/ ctx[1] && create_if_block$3(ctx);

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
    			attr_dev(span0, "class", "dot dot-one svelte-15qcjnw");
    			add_location(span0, file$7, 118, 6, 2110);
    			attr_dev(span1, "class", "dot dot-two svelte-15qcjnw");
    			add_location(span1, file$7, 119, 6, 2146);
    			attr_dev(span2, "class", "dot dot-three svelte-15qcjnw");
    			add_location(span2, file$7, 120, 6, 2182);
    			attr_dev(span3, "class", "dotAnim svelte-15qcjnw");
    			add_location(span3, file$7, 117, 4, 2080);
    			attr_dev(h1, "class", "svelte-15qcjnw");
    			add_location(h1, file$7, 115, 2, 2059);
    			attr_dev(header, "class", "svelte-15qcjnw");
    			add_location(header, file$7, 114, 0, 2047);
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
    			if (/*showNav*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { showNav = false } = $$props;
    	let { toggleNav } = $$props;

    	const handleClick = () => {
    		$$invalidate(0, toggleNav = !toggleNav);
    	};

    	const writable_props = ["showNav", "toggleNav"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("showNav" in $$props) $$invalidate(1, showNav = $$props.showNav);
    		if ("toggleNav" in $$props) $$invalidate(0, toggleNav = $$props.toggleNav);
    	};

    	$$self.$capture_state = () => {
    		return { showNav, toggleNav };
    	};

    	$$self.$inject_state = $$props => {
    		if ("showNav" in $$props) $$invalidate(1, showNav = $$props.showNav);
    		if ("toggleNav" in $$props) $$invalidate(0, toggleNav = $$props.toggleNav);
    	};

    	return [toggleNav, showNav, handleClick];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { showNav: 1, toggleNav: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*toggleNav*/ ctx[0] === undefined && !("toggleNav" in props)) {
    			console.warn("<Header> was created without expected prop 'toggleNav'");
    		}
    	}

    	get showNav() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showNav(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggleNav() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleNav(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\RouterLink.svelte generated by Svelte v3.16.7 */
    const file$8 = "src\\components\\RouterLink.svelte";

    function create_fragment$8(ctx) {
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
    			attr_dev(a, "class", "svelte-oyolmb");
    			add_location(a, file$8, 25, 0, 417);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouterLink",
    			options,
    			id: create_fragment$8.name
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
    const file$9 = "src\\components\\Navigation.svelte";

    function create_fragment$9(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let t0;
    	let li1;
    	let t1;
    	let li2;
    	let nav_class_value;
    	let current;

    	const routerlink0 = new RouterLink({
    			props: {
    				page: { path: "/profile", name: "Profile" }
    			},
    			$$inline: true
    		});

    	routerlink0.$on("click", /*click_handler*/ ctx[1]);

    	const routerlink1 = new RouterLink({
    			props: { page: { path: "/mates", name: "Mates" } },
    			$$inline: true
    		});

    	const routerlink2 = new RouterLink({
    			props: {
    				page: { path: "/threads", name: "Threads" }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			create_component(routerlink0.$$.fragment);
    			t0 = space();
    			li1 = element("li");
    			create_component(routerlink1.$$.fragment);
    			t1 = space();
    			li2 = element("li");
    			create_component(routerlink2.$$.fragment);
    			attr_dev(li0, "class", "svelte-141vzsr");
    			add_location(li0, file$9, 54, 4, 1008);
    			attr_dev(li1, "class", "svelte-141vzsr");
    			add_location(li1, file$9, 61, 4, 1179);
    			attr_dev(li2, "class", "svelte-141vzsr");
    			add_location(li2, file$9, 64, 4, 1263);
    			attr_dev(ul, "class", "svelte-141vzsr");
    			add_location(ul, file$9, 53, 2, 998);
    			attr_dev(nav, "class", nav_class_value = "" + (null_to_empty(/*toggleNav*/ ctx[0] ? "show" : "") + " svelte-141vzsr"));
    			add_location(nav, file$9, 52, 0, 957);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			mount_component(routerlink0, li0, null);
    			append_dev(ul, t0);
    			append_dev(ul, li1);
    			mount_component(routerlink1, li1, null);
    			append_dev(ul, t1);
    			append_dev(ul, li2);
    			mount_component(routerlink2, li2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*toggleNav*/ 1 && nav_class_value !== (nav_class_value = "" + (null_to_empty(/*toggleNav*/ ctx[0] ? "show" : "") + " svelte-141vzsr"))) {
    				attr_dev(nav, "class", nav_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerlink0.$$.fragment, local);
    			transition_in(routerlink1.$$.fragment, local);
    			transition_in(routerlink2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerlink0.$$.fragment, local);
    			transition_out(routerlink1.$$.fragment, local);
    			transition_out(routerlink2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(routerlink0);
    			destroy_component(routerlink1);
    			destroy_component(routerlink2);
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

    function instance$9($$self, $$props, $$invalidate) {
    	let { toggleNav } = $$props;

    	onMount(() => {
    		curRoute.set(window.location.pathname);

    		if (!history.state) {
    			window.history.replaceState({ path: window.location.pathname }, "", window.location.href);
    		}
    	});

    	const writable_props = ["toggleNav"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, toggleNav = !toggleNav);
    	};

    	$$self.$set = $$props => {
    		if ("toggleNav" in $$props) $$invalidate(0, toggleNav = $$props.toggleNav);
    	};

    	$$self.$capture_state = () => {
    		return { toggleNav };
    	};

    	$$self.$inject_state = $$props => {
    		if ("toggleNav" in $$props) $$invalidate(0, toggleNav = $$props.toggleNav);
    	};

    	return [toggleNav, click_handler];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { toggleNav: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*toggleNav*/ ctx[0] === undefined && !("toggleNav" in props)) {
    			console.warn("<Navigation> was created without expected prop 'toggleNav'");
    		}
    	}

    	get toggleNav() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggleNav(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.16.7 */

    const { window: window_1 } = globals;
    const file$a = "src\\App.svelte";

    // (42:0) {#if $isLoggedIn}
    function create_if_block$4(ctx) {
    	let updating_toggleNav;
    	let current;

    	function navigation_toggleNav_binding(value) {
    		/*navigation_toggleNav_binding*/ ctx[6].call(null, value);
    	}

    	let navigation_props = {};

    	if (/*toggleNav*/ ctx[0] !== void 0) {
    		navigation_props.toggleNav = /*toggleNav*/ ctx[0];
    	}

    	const navigation = new Navigation({ props: navigation_props, $$inline: true });
    	binding_callbacks.push(() => bind(navigation, "toggleNav", navigation_toggleNav_binding));

    	const block = {
    		c: function create() {
    			create_component(navigation.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navigation, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const navigation_changes = {};

    			if (!updating_toggleNav && dirty & /*toggleNav*/ 1) {
    				updating_toggleNav = true;
    				navigation_changes.toggleNav = /*toggleNav*/ ctx[0];
    				add_flush_callback(() => updating_toggleNav = false);
    			}

    			navigation.$set(navigation_changes);
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(42:0) {#if $isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let title_value;
    	let t0;
    	let updating_toggleNav;
    	let t1;
    	let t2;
    	let main;
    	let current;
    	let dispose;
    	document.title = title_value = "Convo - " + router[/*$curRoute*/ ctx[1]].title;

    	function header_toggleNav_binding(value) {
    		/*header_toggleNav_binding*/ ctx[5].call(null, value);
    	}

    	let header_props = { showNav: /*$isLoggedIn*/ ctx[2] };

    	if (/*toggleNav*/ ctx[0] !== void 0) {
    		header_props.toggleNav = /*toggleNav*/ ctx[0];
    	}

    	const header = new Header({ props: header_props, $$inline: true });
    	binding_callbacks.push(() => bind(header, "toggleNav", header_toggleNav_binding));
    	let if_block = /*$isLoggedIn*/ ctx[2] && create_if_block$4(ctx);
    	var switch_value = router[/*$curRoute*/ ctx[1]].view;

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
    			add_location(main, file$a, 44, 0, 1143);

    			dispose = [
    				listen_dev(window_1, "popstate", /*handleBackNavigation*/ ctx[3], false, false, false),
    				listen_dev(window_1, "storage", /*syncLogOut*/ ctx[4], false, false, false)
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
    			if ((!current || dirty & /*router, $curRoute*/ 2) && title_value !== (title_value = "Convo - " + router[/*$curRoute*/ ctx[1]].title)) {
    				document.title = title_value;
    			}

    			const header_changes = {};
    			if (dirty & /*$isLoggedIn*/ 4) header_changes.showNav = /*$isLoggedIn*/ ctx[2];

    			if (!updating_toggleNav && dirty & /*toggleNav*/ 1) {
    				updating_toggleNav = true;
    				header_changes.toggleNav = /*toggleNav*/ ctx[0];
    				add_flush_callback(() => updating_toggleNav = false);
    			}

    			header.$set(header_changes);

    			if (/*$isLoggedIn*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (switch_value !== (switch_value = router[/*$curRoute*/ ctx[1]].view)) {
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $curRoute;
    	let $isLoggedIn;
    	validate_store(curRoute, "curRoute");
    	component_subscribe($$self, curRoute, $$value => $$invalidate(1, $curRoute = $$value));
    	validate_store(isLoggedIn, "isLoggedIn");
    	component_subscribe($$self, isLoggedIn, $$value => $$invalidate(2, $isLoggedIn = $$value));
    	let toggleNav = false;

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

    	function header_toggleNav_binding(value) {
    		toggleNav = value;
    		$$invalidate(0, toggleNav);
    	}

    	function navigation_toggleNav_binding(value) {
    		toggleNav = value;
    		$$invalidate(0, toggleNav);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("toggleNav" in $$props) $$invalidate(0, toggleNav = $$props.toggleNav);
    		if ("$curRoute" in $$props) curRoute.set($curRoute = $$props.$curRoute);
    		if ("$isLoggedIn" in $$props) isLoggedIn.set($isLoggedIn = $$props.$isLoggedIn);
    	};

    	return [
    		toggleNav,
    		$curRoute,
    		$isLoggedIn,
    		handleBackNavigation,
    		syncLogOut,
    		header_toggleNav_binding,
    		navigation_toggleNav_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
