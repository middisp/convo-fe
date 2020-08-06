
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
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
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.16.7 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (219:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
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
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(219:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (217:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(217:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	const qsPosition = location.indexOf("?");
    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	return tick().then(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function link(node, hrefVar) {
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    function updateLink(node, href) {
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	node.setAttribute("href", "#" + href);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	class RouteItem {
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		match(path) {
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	const routesList = [];

    	if (routes instanceof Map) {
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	let component = null;
    	let componentParams = null;
    	const dispatch = createEventDispatcher();

    	const dispatchNextTick = (name, detail) => {
    		tick().then(() => {
    			dispatch(name, detail);
    		});
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => {
    		return {
    			routes,
    			prefix,
    			component,
    			componentParams,
    			$loc
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("$loc" in $$props) loc.set($loc = $$props.$loc);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			 {
    				$$invalidate(0, component = null);
    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						if (!routesList[i].checkConditions(detail)) {
    							dispatchNextTick("conditionsFailed", detail);
    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const user = writable();
    const isLoggedIn = writable(false);
    const token = writable('');
    const navOpen = writable(false);
    const alert = writable();

    user.subscribe(value => {
      if (value) {
        localStorage.setItem('user', JSON.stringify(value));
      }
      else {
        localStorage.removeItem('user');
      }
    });

    /* src\components\Input.svelte generated by Svelte v3.16.7 */

    const file = "src\\components\\Input.svelte";

    // (65:0) {#if !hideLabel}
    function create_if_block_1(ctx) {
    	let label;
    	let t0;
    	let t1_value = (/*required*/ ctx[5] ? "*" : "") + "";
    	let t1;
    	let label_class_value;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text(/*labelText*/ ctx[3]);
    			t1 = text(t1_value);
    			attr_dev(label, "class", label_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1ukqscq"));
    			attr_dev(label, "for", /*name*/ ctx[2]);
    			add_location(label, file, 65, 2, 1159);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*labelText*/ 8) set_data_dev(t0, /*labelText*/ ctx[3]);
    			if (dirty & /*required*/ 32 && t1_value !== (t1_value = (/*required*/ ctx[5] ? "*" : "") + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*error*/ 2 && label_class_value !== (label_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1ukqscq"))) {
    				attr_dev(label, "class", label_class_value);
    			}

    			if (dirty & /*name*/ 4) {
    				attr_dev(label, "for", /*name*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(65:0) {#if !hideLabel}",
    		ctx
    	});

    	return block;
    }

    // (70:0) {#if error}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Required field";
    			attr_dev(span, "class", "error svelte-1ukqscq");
    			add_location(span, file, 70, 2, 1280);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(70:0) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t0;
    	let t1;
    	let input;
    	let input_class_value;
    	let dispose;
    	let if_block0 = !/*hideLabel*/ ctx[7] && create_if_block_1(ctx);
    	let if_block1 = /*error*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			input = element("input");
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1ukqscq"));
    			attr_dev(input, "name", /*name*/ ctx[2]);
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "id", /*name*/ ctx[2]);
    			attr_dev(input, "type", /*type*/ ctx[4]);
    			input.required = /*required*/ ctx[5];
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[8]);
    			input.disabled = /*disabled*/ ctx[6];
    			add_location(input, file, 72, 0, 1330);

    			dispose = [
    				listen_dev(input, "input", /*handleInput*/ ctx[9], false, false, false),
    				listen_dev(input, "blur", /*handleBlur*/ ctx[10], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*hideLabel*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*error*/ ctx[1]) {
    				if (!if_block1) {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*error*/ 2 && input_class_value !== (input_class_value = "" + (null_to_empty(/*error*/ ctx[1] ? "error" : "") + " svelte-1ukqscq"))) {
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

    			if (dirty & /*placeholder*/ 256) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[8]);
    			}

    			if (dirty & /*disabled*/ 64) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[6]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			run_all(dispose);
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
    	let { name } = $$props;
    	let { labelText } = $$props;
    	let { value } = $$props;
    	let { type = "text" } = $$props;
    	let { error = false } = $$props;
    	let { required } = $$props;
    	let { disabled = false } = $$props;
    	let { hideLabel = false } = $$props;
    	let { placeholder } = $$props;

    	const handleInput = e => {
    		$$invalidate(0, value = type.match(/^(number|range)$/)
    		? +e.target.value
    		: e.target.value);
    	};

    	const handleBlur = e => {
    		$$invalidate(1, error = !e.target.value);
    	};

    	const writable_props = [
    		"name",
    		"labelText",
    		"value",
    		"type",
    		"error",
    		"required",
    		"disabled",
    		"hideLabel",
    		"placeholder"
    	];

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
    		if ("hideLabel" in $$props) $$invalidate(7, hideLabel = $$props.hideLabel);
    		if ("placeholder" in $$props) $$invalidate(8, placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => {
    		return {
    			name,
    			labelText,
    			value,
    			type,
    			error,
    			required,
    			disabled,
    			hideLabel,
    			placeholder
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
    		if ("hideLabel" in $$props) $$invalidate(7, hideLabel = $$props.hideLabel);
    		if ("placeholder" in $$props) $$invalidate(8, placeholder = $$props.placeholder);
    	};

    	return [
    		value,
    		error,
    		name,
    		labelText,
    		type,
    		required,
    		disabled,
    		hideLabel,
    		placeholder,
    		handleInput,
    		handleBlur
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			name: 2,
    			labelText: 3,
    			value: 0,
    			type: 4,
    			error: 1,
    			required: 5,
    			disabled: 6,
    			hideLabel: 7,
    			placeholder: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$1.name
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

    		if (/*placeholder*/ ctx[8] === undefined && !("placeholder" in props)) {
    			console.warn("<Input> was created without expected prop 'placeholder'");
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

    	get hideLabel() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideLabel(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Button.svelte generated by Svelte v3.16.7 */
    const file$1 = "src\\components\\Button.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(button, "type", /*type*/ ctx[1]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*klass*/ ctx[3]) + " svelte-7ywawd"));
    			button.disabled = /*disabled*/ ctx[0];
    			add_location(button, file$1, 68, 0, 1140);
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

    			if (dirty & /*klass*/ 8 && button_class_value !== (button_class_value = "" + (null_to_empty(/*klass*/ ctx[3]) + " svelte-7ywawd"))) {
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { disabled = false } = $$props;
    	let { type } = $$props;
    	let { text } = $$props;
    	let { klass } = $$props;
    	const handleClick = () => dispatch("click");
    	const writable_props = ["disabled", "type", "text", "klass"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("klass" in $$props) $$invalidate(3, klass = $$props.klass);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, type, text, klass };
    	};

    	$$self.$inject_state = $$props => {
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("klass" in $$props) $$invalidate(3, klass = $$props.klass);
    	};

    	return [disabled, type, text, klass, handleClick];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
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
    			id: create_fragment$2.name
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
    		return this.$$.ctx[4];
    	}

    	set handleClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Views\Login.svelte generated by Svelte v3.16.7 */
    const file$2 = "src\\Views\\Login.svelte";

    function create_fragment$3(ctx) {
    	let h1;
    	let t1;
    	let form;
    	let updating_value;
    	let t2;
    	let updating_value_1;
    	let t3;
    	let current;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[4].call(null, value);
    	}

    	let input0_props = {
    		type: "email",
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
    		/*input1_value_binding*/ ctx[5].call(null, value_1);
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
    				klass: "primary",
    				text: "Login"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*login*/ ctx[2]);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Hi!";
    			t1 = space();
    			form = element("form");
    			create_component(input0.$$.fragment);
    			t2 = space();
    			create_component(input1.$$.fragment);
    			t3 = space();
    			create_component(button.$$.fragment);
    			attr_dev(h1, "class", "svelte-l33yj5");
    			add_location(h1, file$2, 51, 0, 1273);
    			attr_dev(form, "action", "post");
    			add_location(form, file$2, 52, 0, 1287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			mount_component(input0, form, null);
    			append_dev(form, t2);
    			mount_component(input1, form, null);
    			append_dev(form, t3);
    			mount_component(button, form, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
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

    	const saveToSession = data => {
    		window.sessionStorage.setItem("token", data);
    	};

    	const login = () => {
    		if (!email || !password) {
    			return alert.set({
    				message: "Please provide your login details",
    				type: "error"
    			});
    		}

    		fetch("http://localhost:3001/login", {
    			method: "post",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify({ email, password })
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				alert.set({ message: result.message, type: "error" });
    			} else {
    				user.set(result.user);
    				token.set(result.token);
    				saveToSession(result.token);
    				isLoggedIn.set(true);
    				push("/threads");
    			}
    		}).catch(e => {
    			alert.set({ message: e, type: "error" });
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
    	};

    	return [
    		email,
    		password,
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

    /* src\components\Toggle.svelte generated by Svelte v3.16.7 */

    const file$3 = "src\\components\\Toggle.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(input, file$3, 61, 0, 1109);
    			attr_dev(label, "for", /*name*/ ctx[1]);
    			attr_dev(label, "class", "svelte-1g1xjfv");
    			add_location(label, file$3, 62, 0, 1174);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { name: 1, labelText: 2, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggle",
    			options,
    			id: create_fragment$4.name
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

    /* src\components\UserMessage.svelte generated by Svelte v3.16.7 */
    const file$4 = "src\\components\\UserMessage.svelte";

    function create_fragment$5(ctx) {
    	let aside;
    	let button;
    	let t1;
    	let p;
    	let t2_value = /*$alert*/ ctx[0].message + "";
    	let t2;
    	let aside_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			button = element("button");
    			button.textContent = "×";
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			attr_dev(button, "class", "svelte-1v9dvel");
    			add_location(button, file$4, 56, 2, 1102);
    			attr_dev(p, "class", "svelte-1v9dvel");
    			add_location(p, file$4, 57, 2, 1159);
    			attr_dev(aside, "class", aside_class_value = "" + (null_to_empty(/*$alert*/ ctx[0].type) + " svelte-1v9dvel"));
    			add_location(aside, file$4, 55, 0, 1071);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
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
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$alert*/ 1 && t2_value !== (t2_value = /*$alert*/ ctx[0].message + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$alert*/ 1 && aside_class_value !== (aside_class_value = "" + (null_to_empty(/*$alert*/ ctx[0].type) + " svelte-1v9dvel"))) {
    				attr_dev(aside, "class", aside_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
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
    	let $alert;
    	validate_store(alert, "alert");
    	component_subscribe($$self, alert, $$value => $$invalidate(0, $alert = $$value));
    	const click_handler = () => alert.set();

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$alert" in $$props) alert.set($alert = $$props.$alert);
    	};

    	return [$alert, click_handler];
    }

    class UserMessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UserMessage",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Views\Profile.svelte generated by Svelte v3.16.7 */
    const file$5 = "src\\Views\\Profile.svelte";

    // (98:0) {#if $user}
    function create_if_block$2(ctx) {
    	let form0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let updating_value;
    	let t1;
    	let updating_value_1;
    	let t2;
    	let updating_value_2;
    	let t3;
    	let updating_value_3;
    	let t4;
    	let updating_value_4;
    	let t5;
    	let t6;
    	let form1;
    	let legend;
    	let t8;
    	let updating_value_5;
    	let t9;
    	let updating_value_6;
    	let t10;
    	let updating_value_7;
    	let t11;
    	let current;

    	function toggle_value_binding(value) {
    		/*toggle_value_binding*/ ctx[9].call(null, value);
    	}

    	let toggle_props = { name: "edit", labelText: "Edit" };

    	if (/*isEditable*/ ctx[0] !== void 0) {
    		toggle_props.value = /*isEditable*/ ctx[0];
    	}

    	const toggle = new Toggle({ props: toggle_props, $$inline: true });
    	binding_callbacks.push(() => bind(toggle, "value", toggle_value_binding));

    	function input0_value_binding(value_1) {
    		/*input0_value_binding*/ ctx[10].call(null, value_1);
    	}

    	let input0_props = {
    		type: "text",
    		name: "displayName",
    		labelText: "Display name",
    		disabled: !/*isEditable*/ ctx[0],
    		required: false
    	};

    	if (/*updatedUser*/ ctx[4].displayName !== void 0) {
    		input0_props.value = /*updatedUser*/ ctx[4].displayName;
    	}

    	const input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value_2) {
    		/*input1_value_binding*/ ctx[11].call(null, value_2);
    	}

    	let input1_props = {
    		type: "text",
    		name: "firstName",
    		labelText: "First name",
    		disabled: !/*isEditable*/ ctx[0],
    		required: false
    	};

    	if (/*updatedUser*/ ctx[4].firstName !== void 0) {
    		input1_props.value = /*updatedUser*/ ctx[4].firstName;
    	}

    	const input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value_3) {
    		/*input2_value_binding*/ ctx[12].call(null, value_3);
    	}

    	let input2_props = {
    		type: "text",
    		name: "lastName",
    		labelText: "Last name",
    		disabled: !/*isEditable*/ ctx[0],
    		required: false
    	};

    	if (/*updatedUser*/ ctx[4].lastName !== void 0) {
    		input2_props.value = /*updatedUser*/ ctx[4].lastName;
    	}

    	const input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value_4) {
    		/*input3_value_binding*/ ctx[13].call(null, value_4);
    	}

    	let input3_props = {
    		type: "text",
    		name: "email",
    		labelText: "Email",
    		disabled: !/*isEditable*/ ctx[0],
    		required: false
    	};

    	if (/*updatedUser*/ ctx[4].email !== void 0) {
    		input3_props.value = /*updatedUser*/ ctx[4].email;
    	}

    	const input3 = new Input({ props: input3_props, $$inline: true });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));
    	let if_block = /*isEditable*/ ctx[0] && create_if_block_1$1(ctx);

    	function input4_value_binding(value_5) {
    		/*input4_value_binding*/ ctx[14].call(null, value_5);
    	}

    	let input4_props = {
    		type: "password",
    		name: "password",
    		labelText: "Current Password",
    		required: true
    	};

    	if (/*currentPassword*/ ctx[1] !== void 0) {
    		input4_props.value = /*currentPassword*/ ctx[1];
    	}

    	const input4 = new Input({ props: input4_props, $$inline: true });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value_6) {
    		/*input5_value_binding*/ ctx[15].call(null, value_6);
    	}

    	let input5_props = {
    		type: "password",
    		name: "new-password",
    		labelText: "New Password",
    		required: true
    	};

    	if (/*newPassword*/ ctx[2] !== void 0) {
    		input5_props.value = /*newPassword*/ ctx[2];
    	}

    	const input5 = new Input({ props: input5_props, $$inline: true });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value_7) {
    		/*input6_value_binding*/ ctx[16].call(null, value_7);
    	}

    	let input6_props = {
    		type: "password",
    		name: "c-password",
    		labelText: "Confirm New Password",
    		required: true
    	};

    	if (/*confNewPassword*/ ctx[3] !== void 0) {
    		input6_props.value = /*confNewPassword*/ ctx[3];
    	}

    	const input6 = new Input({ props: input6_props, $$inline: true });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	const button = new Button({
    			props: {
    				type: "submit",
    				klass: "primary",
    				text: "Save"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*updatePassword*/ ctx[7]);

    	const block = {
    		c: function create() {
    			form0 = element("form");
    			img = element("img");
    			t0 = space();
    			create_component(toggle.$$.fragment);
    			t1 = space();
    			create_component(input0.$$.fragment);
    			t2 = space();
    			create_component(input1.$$.fragment);
    			t3 = space();
    			create_component(input2.$$.fragment);
    			t4 = space();
    			create_component(input3.$$.fragment);
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			form1 = element("form");
    			legend = element("legend");
    			legend.textContent = "Password management";
    			t8 = space();
    			create_component(input4.$$.fragment);
    			t9 = space();
    			create_component(input5.$$.fragment);
    			t10 = space();
    			create_component(input6.$$.fragment);
    			t11 = space();
    			create_component(button.$$.fragment);
    			if (img.src !== (img_src_value = "/images/default-avatar.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*updatedUser*/ ctx[4].name);
    			attr_dev(img, "class", "svelte-15y7ane");
    			add_location(img, file$5, 99, 4, 2680);
    			attr_dev(form0, "class", "card userDetails svelte-15y7ane");
    			add_location(form0, file$5, 98, 2, 2643);
    			attr_dev(legend, "class", "svelte-15y7ane");
    			add_location(legend, file$5, 139, 4, 3716);
    			attr_dev(form1, "class", "card passwordManagement svelte-15y7ane");
    			add_location(form1, file$5, 138, 2, 3672);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form0, anchor);
    			append_dev(form0, img);
    			append_dev(form0, t0);
    			mount_component(toggle, form0, null);
    			append_dev(form0, t1);
    			mount_component(input0, form0, null);
    			append_dev(form0, t2);
    			mount_component(input1, form0, null);
    			append_dev(form0, t3);
    			mount_component(input2, form0, null);
    			append_dev(form0, t4);
    			mount_component(input3, form0, null);
    			append_dev(form0, t5);
    			if (if_block) if_block.m(form0, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, form1, anchor);
    			append_dev(form1, legend);
    			append_dev(form1, t8);
    			mount_component(input4, form1, null);
    			append_dev(form1, t9);
    			mount_component(input5, form1, null);
    			append_dev(form1, t10);
    			mount_component(input6, form1, null);
    			append_dev(form1, t11);
    			mount_component(button, form1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*updatedUser*/ 16 && img_alt_value !== (img_alt_value = /*updatedUser*/ ctx[4].name)) {
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

    			if (!updating_value_1 && dirty & /*updatedUser*/ 16) {
    				updating_value_1 = true;
    				input0_changes.value = /*updatedUser*/ ctx[4].displayName;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};
    			if (dirty & /*isEditable*/ 1) input1_changes.disabled = !/*isEditable*/ ctx[0];

    			if (!updating_value_2 && dirty & /*updatedUser*/ 16) {
    				updating_value_2 = true;
    				input1_changes.value = /*updatedUser*/ ctx[4].firstName;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};
    			if (dirty & /*isEditable*/ 1) input2_changes.disabled = !/*isEditable*/ ctx[0];

    			if (!updating_value_3 && dirty & /*updatedUser*/ 16) {
    				updating_value_3 = true;
    				input2_changes.value = /*updatedUser*/ ctx[4].lastName;
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};
    			if (dirty & /*isEditable*/ 1) input3_changes.disabled = !/*isEditable*/ ctx[0];

    			if (!updating_value_4 && dirty & /*updatedUser*/ 16) {
    				updating_value_4 = true;
    				input3_changes.value = /*updatedUser*/ ctx[4].email;
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input3.$set(input3_changes);

    			if (/*isEditable*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(form0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			const input4_changes = {};

    			if (!updating_value_5 && dirty & /*currentPassword*/ 2) {
    				updating_value_5 = true;
    				input4_changes.value = /*currentPassword*/ ctx[1];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_6 && dirty & /*newPassword*/ 4) {
    				updating_value_6 = true;
    				input5_changes.value = /*newPassword*/ ctx[2];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_7 && dirty & /*confNewPassword*/ 8) {
    				updating_value_7 = true;
    				input6_changes.value = /*confNewPassword*/ ctx[3];
    				add_flush_callback(() => updating_value_7 = false);
    			}

    			input6.$set(input6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toggle.$$.fragment, local);
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toggle.$$.fragment, local);
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form0);
    			destroy_component(toggle);
    			destroy_component(input0);
    			destroy_component(input1);
    			destroy_component(input2);
    			destroy_component(input3);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(form1);
    			destroy_component(input4);
    			destroy_component(input5);
    			destroy_component(input6);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(98:0) {#if $user}",
    		ctx
    	});

    	return block;
    }

    // (134:4) {#if isEditable}
    function create_if_block_1$1(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				type: "submit",
    				klass: "primary",
    				text: "Save"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*save*/ ctx[6]);

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
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(134:4) {#if isEditable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$user*/ ctx[5] && create_if_block$2(ctx);

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
    			if (/*$user*/ ctx[5]) {
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
    	component_subscribe($$self, user, $$value => $$invalidate(5, $user = $$value));
    	validate_store(token, "token");
    	component_subscribe($$self, token, $$value => $$invalidate(8, $token = $$value));
    	let isEditable;
    	let currentPassword = "";
    	let newPassword = "";
    	let confNewPassword = "";
    	let updatedUser = $user;

    	const save = () => {
    		fetch(`http://localhost:3001/user/update/${updatedUser._id}`, {
    			method: "put",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			},
    			body: JSON.stringify(updatedUser)
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				return alert.set({ message: result.message, type: "error" });
    			}

    			user.update(result => result);
    			$$invalidate(0, isEditable = false);

    			alert.set({
    				message: "Update successful",
    				type: "success"
    			});
    		}).catch(e => {
    			alert.set({ message: e, type: "error" });
    			console.log(e);
    		});
    	};

    	const updatePassword = () => {
    		if (!currentPassword || !newPassword || !confNewPassword) {
    			return error = {
    				message: "Please provide passwords",
    				type: "error"
    			};
    		}

    		if (newPassword !== confNewPassword) {
    			return error = {
    				message: "Passwords don't match",
    				type: "error"
    			};
    		}

    		fetch(`http://localhost:3001/login/updatePassword/${$user._id}`, {
    			method: "put",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			},
    			body: JSON.stringify({ currentPassword, newPassword })
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				return alert.set({ message: result.message, type: "error" });
    			}

    			user.update(result => result);

    			alert.set({
    				message: "Update successful",
    				type: "success"
    			});
    		}).catch(e => {
    			alert.set({ message: e, type: "error" });
    			console.log(e);
    		});
    	};

    	function toggle_value_binding(value) {
    		isEditable = value;
    		$$invalidate(0, isEditable);
    	}

    	function input0_value_binding(value_1) {
    		updatedUser.displayName = value_1;
    		$$invalidate(4, updatedUser);
    	}

    	function input1_value_binding(value_2) {
    		updatedUser.firstName = value_2;
    		$$invalidate(4, updatedUser);
    	}

    	function input2_value_binding(value_3) {
    		updatedUser.lastName = value_3;
    		$$invalidate(4, updatedUser);
    	}

    	function input3_value_binding(value_4) {
    		updatedUser.email = value_4;
    		$$invalidate(4, updatedUser);
    	}

    	function input4_value_binding(value_5) {
    		currentPassword = value_5;
    		$$invalidate(1, currentPassword);
    	}

    	function input5_value_binding(value_6) {
    		newPassword = value_6;
    		$$invalidate(2, newPassword);
    	}

    	function input6_value_binding(value_7) {
    		confNewPassword = value_7;
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
    		if ("updatedUser" in $$props) $$invalidate(4, updatedUser = $$props.updatedUser);
    		if ("$user" in $$props) user.set($user = $$props.$user);
    		if ("$token" in $$props) token.set($token = $$props.$token);
    	};

    	return [
    		isEditable,
    		currentPassword,
    		newPassword,
    		confNewPassword,
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
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding
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

    /* src\Views\Threads.svelte generated by Svelte v3.16.7 */
    const file$6 = "src\\Views\\Threads.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (31:0) {#if alert.message}
    function create_if_block_1$2(ctx) {
    	let updating_alert;
    	let current;

    	function usermessage_alert_binding(value) {
    		/*usermessage_alert_binding*/ ctx[4].call(null, value);
    	}

    	let usermessage_props = {};

    	if (/*alert*/ ctx[1] !== void 0) {
    		usermessage_props.alert = /*alert*/ ctx[1];
    	}

    	const usermessage = new UserMessage({ props: usermessage_props, $$inline: true });
    	binding_callbacks.push(() => bind(usermessage, "alert", usermessage_alert_binding));

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

    			if (!updating_alert && dirty & /*alert*/ 2) {
    				updating_alert = true;
    				usermessage_changes.alert = /*alert*/ ctx[1];
    				add_flush_callback(() => updating_alert = false);
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(31:0) {#if alert.message}",
    		ctx
    	});

    	return block;
    }

    // (39:0) {:else}
    function create_else_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No threads";
    			add_location(p, file$6, 39, 2, 888);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(39:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:0) {#if threads.length}
    function create_if_block$3(ctx) {
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(35:0) {#if threads.length}",
    		ctx
    	});

    	return block;
    }

    // (36:2) {#each threads as thread}
    function create_each_block(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*thread*/ ctx[5]._id + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Thread - ");
    			t1 = text(t1_value);
    			add_location(p, file$6, 36, 4, 836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*threads*/ 1 && t1_value !== (t1_value = /*thread*/ ctx[5]._id + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(36:2) {#each threads as thread}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*alert*/ ctx[1].message && create_if_block_1$2(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*threads*/ ctx[0].length) return create_if_block$3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Threads";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h1, file$6, 29, 0, 703);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*alert*/ ctx[1].message) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
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
    	let $user;
    	let $token;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(2, $user = $$value));
    	validate_store(token, "token");
    	component_subscribe($$self, token, $$value => $$invalidate(3, $token = $$value));
    	let threads = [];
    	let alert = {};

    	onMount(() => {
    		fetch(`http://localhost:3001/thread/${$user._id}`, {
    			method: "get",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			}
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				$$invalidate(1, alert = { message: result.message, type: "error" });
    			} else {
    				$$invalidate(0, threads = result);
    			}
    		}).catch(e => console.log(e));
    	});

    	function usermessage_alert_binding(value) {
    		alert = value;
    		$$invalidate(1, alert);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("threads" in $$props) $$invalidate(0, threads = $$props.threads);
    		if ("alert" in $$props) $$invalidate(1, alert = $$props.alert);
    		if ("$user" in $$props) user.set($user = $$props.$user);
    		if ("$token" in $$props) token.set($token = $$props.$token);
    	};

    	return [threads, alert, $user, $token, usermessage_alert_binding];
    }

    class Threads extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Threads",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    function requiredArgs(required, args) {
      if (args.length < required) {
        throw new TypeError(required + ' argument' + (required > 1 ? 's' : '') + ' required, but only ' + args.length + ' present');
      }
    }

    /**
     * @name toDate
     * @category Common Helpers
     * @summary Convert the given argument to an instance of Date.
     *
     * @description
     * Convert the given argument to an instance of Date.
     *
     * If the argument is an instance of Date, the function returns its clone.
     *
     * If the argument is a number, it is treated as a timestamp.
     *
     * If the argument is none of the above, the function returns Invalid Date.
     *
     * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
     *
     * @param {Date|Number} argument - the value to convert
     * @returns {Date} the parsed date in the local time zone
     * @throws {TypeError} 1 argument required
     *
     * @example
     * // Clone the date:
     * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
     * //=> Tue Feb 11 2014 11:30:30
     *
     * @example
     * // Convert the timestamp to date:
     * const result = toDate(1392098430000)
     * //=> Tue Feb 11 2014 11:30:30
     */

    function toDate(argument) {
      requiredArgs(1, arguments);
      var argStr = Object.prototype.toString.call(argument); // Clone the date

      if (argument instanceof Date || typeof argument === 'object' && argStr === '[object Date]') {
        // Prevent the date to lose the milliseconds when passed to new Date() in IE10
        return new Date(argument.getTime());
      } else if (typeof argument === 'number' || argStr === '[object Number]') {
        return new Date(argument);
      } else {
        if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule"); // eslint-disable-next-line no-console

          console.warn(new Error().stack);
        }

        return new Date(NaN);
      }
    }

    var MILLISECONDS_IN_MINUTE = 60000;

    function getDateMillisecondsPart(date) {
      return date.getTime() % MILLISECONDS_IN_MINUTE;
    }
    /**
     * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
     * They usually appear for dates that denote time before the timezones were introduced
     * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
     * and GMT+01:00:00 after that date)
     *
     * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
     * which would lead to incorrect calculations.
     *
     * This function returns the timezone offset in milliseconds that takes seconds in account.
     */


    function getTimezoneOffsetInMilliseconds(dirtyDate) {
      var date = new Date(dirtyDate.getTime());
      var baseTimezoneOffset = Math.ceil(date.getTimezoneOffset());
      date.setSeconds(0, 0);
      var hasNegativeUTCOffset = baseTimezoneOffset > 0;
      var millisecondsPartOfTimezoneOffset = hasNegativeUTCOffset ? (MILLISECONDS_IN_MINUTE + getDateMillisecondsPart(date)) % MILLISECONDS_IN_MINUTE : getDateMillisecondsPart(date);
      return baseTimezoneOffset * MILLISECONDS_IN_MINUTE + millisecondsPartOfTimezoneOffset;
    }

    /**
     * @name compareAsc
     * @category Common Helpers
     * @summary Compare the two dates and return -1, 0 or 1.
     *
     * @description
     * Compare the two dates and return 1 if the first date is after the second,
     * -1 if the first date is before the second or 0 if dates are equal.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} dateLeft - the first date to compare
     * @param {Date|Number} dateRight - the second date to compare
     * @returns {Number} the result of the comparison
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Compare 11 February 1987 and 10 July 1989:
     * var result = compareAsc(new Date(1987, 1, 11), new Date(1989, 6, 10))
     * //=> -1
     *
     * @example
     * // Sort the array of dates:
     * var result = [
     *   new Date(1995, 6, 2),
     *   new Date(1987, 1, 11),
     *   new Date(1989, 6, 10)
     * ].sort(compareAsc)
     * //=> [
     * //   Wed Feb 11 1987 00:00:00,
     * //   Mon Jul 10 1989 00:00:00,
     * //   Sun Jul 02 1995 00:00:00
     * // ]
     */

    function compareAsc(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      var diff = dateLeft.getTime() - dateRight.getTime();

      if (diff < 0) {
        return -1;
      } else if (diff > 0) {
        return 1; // Return 0 if diff is 0; return NaN if diff is NaN
      } else {
        return diff;
      }
    }

    /**
     * @name differenceInCalendarMonths
     * @category Month Helpers
     * @summary Get the number of calendar months between the given dates.
     *
     * @description
     * Get the number of calendar months between the given dates.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} dateLeft - the later date
     * @param {Date|Number} dateRight - the earlier date
     * @returns {Number} the number of calendar months
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // How many calendar months are between 31 January 2014 and 1 September 2014?
     * var result = differenceInCalendarMonths(
     *   new Date(2014, 8, 1),
     *   new Date(2014, 0, 31)
     * )
     * //=> 8
     */

    function differenceInCalendarMonths(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
      var monthDiff = dateLeft.getMonth() - dateRight.getMonth();
      return yearDiff * 12 + monthDiff;
    }

    /**
     * @name differenceInMilliseconds
     * @category Millisecond Helpers
     * @summary Get the number of milliseconds between the given dates.
     *
     * @description
     * Get the number of milliseconds between the given dates.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} dateLeft - the later date
     * @param {Date|Number} dateRight - the earlier date
     * @returns {Number} the number of milliseconds
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // How many milliseconds are between
     * // 2 July 2014 12:30:20.600 and 2 July 2014 12:30:21.700?
     * var result = differenceInMilliseconds(
     *   new Date(2014, 6, 2, 12, 30, 21, 700),
     *   new Date(2014, 6, 2, 12, 30, 20, 600)
     * )
     * //=> 1100
     */

    function differenceInMilliseconds(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      return dateLeft.getTime() - dateRight.getTime();
    }

    /**
     * @name differenceInMonths
     * @category Month Helpers
     * @summary Get the number of full months between the given dates.
     *
     * @description
     * Get the number of full months between the given dates.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} dateLeft - the later date
     * @param {Date|Number} dateRight - the earlier date
     * @returns {Number} the number of full months
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // How many full months are between 31 January 2014 and 1 September 2014?
     * var result = differenceInMonths(new Date(2014, 8, 1), new Date(2014, 0, 31))
     * //=> 7
     */

    function differenceInMonths(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      var sign = compareAsc(dateLeft, dateRight);
      var difference = Math.abs(differenceInCalendarMonths(dateLeft, dateRight));
      dateLeft.setMonth(dateLeft.getMonth() - sign * difference); // Math.abs(diff in full months - diff in calendar months) === 1 if last calendar month is not full
      // If so, result must be decreased by 1 in absolute value

      var isLastMonthNotFull = compareAsc(dateLeft, dateRight) === -sign;
      var result = sign * (difference - isLastMonthNotFull); // Prevent negative zero

      return result === 0 ? 0 : result;
    }

    /**
     * @name differenceInSeconds
     * @category Second Helpers
     * @summary Get the number of seconds between the given dates.
     *
     * @description
     * Get the number of seconds between the given dates.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} dateLeft - the later date
     * @param {Date|Number} dateRight - the earlier date
     * @returns {Number} the number of seconds
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // How many seconds are between
     * // 2 July 2014 12:30:07.999 and 2 July 2014 12:30:20.000?
     * var result = differenceInSeconds(
     *   new Date(2014, 6, 2, 12, 30, 20, 0),
     *   new Date(2014, 6, 2, 12, 30, 7, 999)
     * )
     * //=> 12
     */

    function differenceInSeconds(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var diff = differenceInMilliseconds(dirtyDateLeft, dirtyDateRight) / 1000;
      return diff > 0 ? Math.floor(diff) : Math.ceil(diff);
    }

    var formatDistanceLocale = {
      lessThanXSeconds: {
        one: 'less than a second',
        other: 'less than {{count}} seconds'
      },
      xSeconds: {
        one: '1 second',
        other: '{{count}} seconds'
      },
      halfAMinute: 'half a minute',
      lessThanXMinutes: {
        one: 'less than a minute',
        other: 'less than {{count}} minutes'
      },
      xMinutes: {
        one: '1 minute',
        other: '{{count}} minutes'
      },
      aboutXHours: {
        one: 'about 1 hour',
        other: 'about {{count}} hours'
      },
      xHours: {
        one: '1 hour',
        other: '{{count}} hours'
      },
      xDays: {
        one: '1 day',
        other: '{{count}} days'
      },
      aboutXWeeks: {
        one: 'about 1 week',
        other: 'about {{count}} weeks'
      },
      xWeeks: {
        one: '1 week',
        other: '{{count}} weeks'
      },
      aboutXMonths: {
        one: 'about 1 month',
        other: 'about {{count}} months'
      },
      xMonths: {
        one: '1 month',
        other: '{{count}} months'
      },
      aboutXYears: {
        one: 'about 1 year',
        other: 'about {{count}} years'
      },
      xYears: {
        one: '1 year',
        other: '{{count}} years'
      },
      overXYears: {
        one: 'over 1 year',
        other: 'over {{count}} years'
      },
      almostXYears: {
        one: 'almost 1 year',
        other: 'almost {{count}} years'
      }
    };
    function formatDistance(token, count, options) {
      options = options || {};
      var result;

      if (typeof formatDistanceLocale[token] === 'string') {
        result = formatDistanceLocale[token];
      } else if (count === 1) {
        result = formatDistanceLocale[token].one;
      } else {
        result = formatDistanceLocale[token].other.replace('{{count}}', count);
      }

      if (options.addSuffix) {
        if (options.comparison > 0) {
          return 'in ' + result;
        } else {
          return result + ' ago';
        }
      }

      return result;
    }

    function buildFormatLongFn(args) {
      return function (dirtyOptions) {
        var options = dirtyOptions || {};
        var width = options.width ? String(options.width) : args.defaultWidth;
        var format = args.formats[width] || args.formats[args.defaultWidth];
        return format;
      };
    }

    var dateFormats = {
      full: 'EEEE, MMMM do, y',
      long: 'MMMM do, y',
      medium: 'MMM d, y',
      short: 'MM/dd/yyyy'
    };
    var timeFormats = {
      full: 'h:mm:ss a zzzz',
      long: 'h:mm:ss a z',
      medium: 'h:mm:ss a',
      short: 'h:mm a'
    };
    var dateTimeFormats = {
      full: "{{date}} 'at' {{time}}",
      long: "{{date}} 'at' {{time}}",
      medium: '{{date}}, {{time}}',
      short: '{{date}}, {{time}}'
    };
    var formatLong = {
      date: buildFormatLongFn({
        formats: dateFormats,
        defaultWidth: 'full'
      }),
      time: buildFormatLongFn({
        formats: timeFormats,
        defaultWidth: 'full'
      }),
      dateTime: buildFormatLongFn({
        formats: dateTimeFormats,
        defaultWidth: 'full'
      })
    };

    var formatRelativeLocale = {
      lastWeek: "'last' eeee 'at' p",
      yesterday: "'yesterday at' p",
      today: "'today at' p",
      tomorrow: "'tomorrow at' p",
      nextWeek: "eeee 'at' p",
      other: 'P'
    };
    function formatRelative(token, _date, _baseDate, _options) {
      return formatRelativeLocale[token];
    }

    function buildLocalizeFn(args) {
      return function (dirtyIndex, dirtyOptions) {
        var options = dirtyOptions || {};
        var context = options.context ? String(options.context) : 'standalone';
        var valuesArray;

        if (context === 'formatting' && args.formattingValues) {
          var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
          var width = options.width ? String(options.width) : defaultWidth;
          valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
        } else {
          var _defaultWidth = args.defaultWidth;

          var _width = options.width ? String(options.width) : args.defaultWidth;

          valuesArray = args.values[_width] || args.values[_defaultWidth];
        }

        var index = args.argumentCallback ? args.argumentCallback(dirtyIndex) : dirtyIndex;
        return valuesArray[index];
      };
    }

    var eraValues = {
      narrow: ['B', 'A'],
      abbreviated: ['BC', 'AD'],
      wide: ['Before Christ', 'Anno Domini']
    };
    var quarterValues = {
      narrow: ['1', '2', '3', '4'],
      abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
      wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'] // Note: in English, the names of days of the week and months are capitalized.
      // If you are making a new locale based on this one, check if the same is true for the language you're working on.
      // Generally, formatted dates should look like they are in the middle of a sentence,
      // e.g. in Spanish language the weekdays and months should be in the lowercase.

    };
    var monthValues = {
      narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      abbreviated: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      wide: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var dayValues = {
      narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    var dayPeriodValues = {
      narrow: {
        am: 'a',
        pm: 'p',
        midnight: 'mi',
        noon: 'n',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      },
      abbreviated: {
        am: 'AM',
        pm: 'PM',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      },
      wide: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      }
    };
    var formattingDayPeriodValues = {
      narrow: {
        am: 'a',
        pm: 'p',
        midnight: 'mi',
        noon: 'n',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      },
      abbreviated: {
        am: 'AM',
        pm: 'PM',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      },
      wide: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      }
    };

    function ordinalNumber(dirtyNumber, _dirtyOptions) {
      var number = Number(dirtyNumber); // If ordinal numbers depend on context, for example,
      // if they are different for different grammatical genders,
      // use `options.unit`:
      //
      //   var options = dirtyOptions || {}
      //   var unit = String(options.unit)
      //
      // where `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
      // 'day', 'hour', 'minute', 'second'

      var rem100 = number % 100;

      if (rem100 > 20 || rem100 < 10) {
        switch (rem100 % 10) {
          case 1:
            return number + 'st';

          case 2:
            return number + 'nd';

          case 3:
            return number + 'rd';
        }
      }

      return number + 'th';
    }

    var localize = {
      ordinalNumber: ordinalNumber,
      era: buildLocalizeFn({
        values: eraValues,
        defaultWidth: 'wide'
      }),
      quarter: buildLocalizeFn({
        values: quarterValues,
        defaultWidth: 'wide',
        argumentCallback: function (quarter) {
          return Number(quarter) - 1;
        }
      }),
      month: buildLocalizeFn({
        values: monthValues,
        defaultWidth: 'wide'
      }),
      day: buildLocalizeFn({
        values: dayValues,
        defaultWidth: 'wide'
      }),
      dayPeriod: buildLocalizeFn({
        values: dayPeriodValues,
        defaultWidth: 'wide',
        formattingValues: formattingDayPeriodValues,
        defaultFormattingWidth: 'wide'
      })
    };

    function buildMatchPatternFn(args) {
      return function (dirtyString, dirtyOptions) {
        var string = String(dirtyString);
        var options = dirtyOptions || {};
        var matchResult = string.match(args.matchPattern);

        if (!matchResult) {
          return null;
        }

        var matchedString = matchResult[0];
        var parseResult = string.match(args.parsePattern);

        if (!parseResult) {
          return null;
        }

        var value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
        value = options.valueCallback ? options.valueCallback(value) : value;
        return {
          value: value,
          rest: string.slice(matchedString.length)
        };
      };
    }

    function buildMatchFn(args) {
      return function (dirtyString, dirtyOptions) {
        var string = String(dirtyString);
        var options = dirtyOptions || {};
        var width = options.width;
        var matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
        var matchResult = string.match(matchPattern);

        if (!matchResult) {
          return null;
        }

        var matchedString = matchResult[0];
        var parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
        var value;

        if (Object.prototype.toString.call(parsePatterns) === '[object Array]') {
          value = findIndex(parsePatterns, function (pattern) {
            return pattern.test(matchedString);
          });
        } else {
          value = findKey(parsePatterns, function (pattern) {
            return pattern.test(matchedString);
          });
        }

        value = args.valueCallback ? args.valueCallback(value) : value;
        value = options.valueCallback ? options.valueCallback(value) : value;
        return {
          value: value,
          rest: string.slice(matchedString.length)
        };
      };
    }

    function findKey(object, predicate) {
      for (var key in object) {
        if (object.hasOwnProperty(key) && predicate(object[key])) {
          return key;
        }
      }
    }

    function findIndex(array, predicate) {
      for (var key = 0; key < array.length; key++) {
        if (predicate(array[key])) {
          return key;
        }
      }
    }

    var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
    var parseOrdinalNumberPattern = /\d+/i;
    var matchEraPatterns = {
      narrow: /^(b|a)/i,
      abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
      wide: /^(before christ|before common era|anno domini|common era)/i
    };
    var parseEraPatterns = {
      any: [/^b/i, /^(a|c)/i]
    };
    var matchQuarterPatterns = {
      narrow: /^[1234]/i,
      abbreviated: /^q[1234]/i,
      wide: /^[1234](th|st|nd|rd)? quarter/i
    };
    var parseQuarterPatterns = {
      any: [/1/i, /2/i, /3/i, /4/i]
    };
    var matchMonthPatterns = {
      narrow: /^[jfmasond]/i,
      abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
    };
    var parseMonthPatterns = {
      narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
      any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
    };
    var matchDayPatterns = {
      narrow: /^[smtwf]/i,
      short: /^(su|mo|tu|we|th|fr|sa)/i,
      abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
      wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
    };
    var parseDayPatterns = {
      narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
      any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
    };
    var matchDayPeriodPatterns = {
      narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
      any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
    };
    var parseDayPeriodPatterns = {
      any: {
        am: /^a/i,
        pm: /^p/i,
        midnight: /^mi/i,
        noon: /^no/i,
        morning: /morning/i,
        afternoon: /afternoon/i,
        evening: /evening/i,
        night: /night/i
      }
    };
    var match = {
      ordinalNumber: buildMatchPatternFn({
        matchPattern: matchOrdinalNumberPattern,
        parsePattern: parseOrdinalNumberPattern,
        valueCallback: function (value) {
          return parseInt(value, 10);
        }
      }),
      era: buildMatchFn({
        matchPatterns: matchEraPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseEraPatterns,
        defaultParseWidth: 'any'
      }),
      quarter: buildMatchFn({
        matchPatterns: matchQuarterPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseQuarterPatterns,
        defaultParseWidth: 'any',
        valueCallback: function (index) {
          return index + 1;
        }
      }),
      month: buildMatchFn({
        matchPatterns: matchMonthPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseMonthPatterns,
        defaultParseWidth: 'any'
      }),
      day: buildMatchFn({
        matchPatterns: matchDayPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseDayPatterns,
        defaultParseWidth: 'any'
      }),
      dayPeriod: buildMatchFn({
        matchPatterns: matchDayPeriodPatterns,
        defaultMatchWidth: 'any',
        parsePatterns: parseDayPeriodPatterns,
        defaultParseWidth: 'any'
      })
    };

    /**
     * @type {Locale}
     * @category Locales
     * @summary English locale (United States).
     * @language English
     * @iso-639-2 eng
     * @author Sasha Koss [@kossnocorp]{@link https://github.com/kossnocorp}
     * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
     */

    var locale = {
      code: 'en-US',
      formatDistance: formatDistance,
      formatLong: formatLong,
      formatRelative: formatRelative,
      localize: localize,
      match: match,
      options: {
        weekStartsOn: 0
        /* Sunday */
        ,
        firstWeekContainsDate: 1
      }
    };

    function assign$1(target, dirtyObject) {
      if (target == null) {
        throw new TypeError('assign requires that input parameter not be null or undefined');
      }

      dirtyObject = dirtyObject || {};

      for (var property in dirtyObject) {
        if (dirtyObject.hasOwnProperty(property)) {
          target[property] = dirtyObject[property];
        }
      }

      return target;
    }

    function cloneObject(dirtyObject) {
      return assign$1({}, dirtyObject);
    }

    var MINUTES_IN_DAY = 1440;
    var MINUTES_IN_ALMOST_TWO_DAYS = 2520;
    var MINUTES_IN_MONTH = 43200;
    var MINUTES_IN_TWO_MONTHS = 86400;
    /**
     * @name formatDistance
     * @category Common Helpers
     * @summary Return the distance between the given dates in words.
     *
     * @description
     * Return the distance between the given dates in words.
     *
     * | Distance between dates                                            | Result              |
     * |-------------------------------------------------------------------|---------------------|
     * | 0 ... 30 secs                                                     | less than a minute  |
     * | 30 secs ... 1 min 30 secs                                         | 1 minute            |
     * | 1 min 30 secs ... 44 mins 30 secs                                 | [2..44] minutes     |
     * | 44 mins ... 30 secs ... 89 mins 30 secs                           | about 1 hour        |
     * | 89 mins 30 secs ... 23 hrs 59 mins 30 secs                        | about [2..24] hours |
     * | 23 hrs 59 mins 30 secs ... 41 hrs 59 mins 30 secs                 | 1 day               |
     * | 41 hrs 59 mins 30 secs ... 29 days 23 hrs 59 mins 30 secs         | [2..30] days        |
     * | 29 days 23 hrs 59 mins 30 secs ... 44 days 23 hrs 59 mins 30 secs | about 1 month       |
     * | 44 days 23 hrs 59 mins 30 secs ... 59 days 23 hrs 59 mins 30 secs | about 2 months      |
     * | 59 days 23 hrs 59 mins 30 secs ... 1 yr                           | [2..12] months      |
     * | 1 yr ... 1 yr 3 months                                            | about 1 year        |
     * | 1 yr 3 months ... 1 yr 9 month s                                  | over 1 year         |
     * | 1 yr 9 months ... 2 yrs                                           | almost 2 years      |
     * | N yrs ... N yrs 3 months                                          | about N years       |
     * | N yrs 3 months ... N yrs 9 months                                 | over N years        |
     * | N yrs 9 months ... N+1 yrs                                        | almost N+1 years    |
     *
     * With `options.includeSeconds == true`:
     * | Distance between dates | Result               |
     * |------------------------|----------------------|
     * | 0 secs ... 5 secs      | less than 5 seconds  |
     * | 5 secs ... 10 secs     | less than 10 seconds |
     * | 10 secs ... 20 secs    | less than 20 seconds |
     * | 20 secs ... 40 secs    | half a minute        |
     * | 40 secs ... 60 secs    | less than a minute   |
     * | 60 secs ... 90 secs    | 1 minute             |
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * - The function was renamed from `distanceInWords ` to `formatDistance`
     *   to make its name consistent with `format` and `formatRelative`.
     *
     * - The order of arguments is swapped to make the function
     *   consistent with `differenceIn...` functions.
     *
     *   ```javascript
     *   // Before v2.0.0
     *
     *   distanceInWords(
     *     new Date(1986, 3, 4, 10, 32, 0),
     *     new Date(1986, 3, 4, 11, 32, 0),
     *     { addSuffix: true }
     *   ) //=> 'in about 1 hour'
     *
     *   // v2.0.0 onward
     *
     *   formatDistance(
     *     new Date(1986, 3, 4, 11, 32, 0),
     *     new Date(1986, 3, 4, 10, 32, 0),
     *     { addSuffix: true }
     *   ) //=> 'in about 1 hour'
     *   ```
     *
     * @param {Date|Number} date - the date
     * @param {Date|Number} baseDate - the date to compare with
     * @param {Object} [options] - an object with options.
     * @param {Boolean} [options.includeSeconds=false] - distances less than a minute are more detailed
     * @param {Boolean} [options.addSuffix=false] - result indicates if the second date is earlier or later than the first
     * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
     * @returns {String} the distance in words
     * @throws {TypeError} 2 arguments required
     * @throws {RangeError} `date` must not be Invalid Date
     * @throws {RangeError} `baseDate` must not be Invalid Date
     * @throws {RangeError} `options.locale` must contain `formatDistance` property
     *
     * @example
     * // What is the distance between 2 July 2014 and 1 January 2015?
     * var result = formatDistance(new Date(2014, 6, 2), new Date(2015, 0, 1))
     * //=> '6 months'
     *
     * @example
     * // What is the distance between 1 January 2015 00:00:15
     * // and 1 January 2015 00:00:00, including seconds?
     * var result = formatDistance(
     *   new Date(2015, 0, 1, 0, 0, 15),
     *   new Date(2015, 0, 1, 0, 0, 0),
     *   { includeSeconds: true }
     * )
     * //=> 'less than 20 seconds'
     *
     * @example
     * // What is the distance from 1 January 2016
     * // to 1 January 2015, with a suffix?
     * var result = formatDistance(new Date(2015, 0, 1), new Date(2016, 0, 1), {
     *   addSuffix: true
     * })
     * //=> 'about 1 year ago'
     *
     * @example
     * // What is the distance between 1 August 2016 and 1 January 2015 in Esperanto?
     * import { eoLocale } from 'date-fns/locale/eo'
     * var result = formatDistance(new Date(2016, 7, 1), new Date(2015, 0, 1), {
     *   locale: eoLocale
     * })
     * //=> 'pli ol 1 jaro'
     */

    function formatDistance$1(dirtyDate, dirtyBaseDate, dirtyOptions) {
      requiredArgs(2, arguments);
      var options = dirtyOptions || {};
      var locale$1 = options.locale || locale;

      if (!locale$1.formatDistance) {
        throw new RangeError('locale must contain formatDistance property');
      }

      var comparison = compareAsc(dirtyDate, dirtyBaseDate);

      if (isNaN(comparison)) {
        throw new RangeError('Invalid time value');
      }

      var localizeOptions = cloneObject(options);
      localizeOptions.addSuffix = Boolean(options.addSuffix);
      localizeOptions.comparison = comparison;
      var dateLeft;
      var dateRight;

      if (comparison > 0) {
        dateLeft = toDate(dirtyBaseDate);
        dateRight = toDate(dirtyDate);
      } else {
        dateLeft = toDate(dirtyDate);
        dateRight = toDate(dirtyBaseDate);
      }

      var seconds = differenceInSeconds(dateRight, dateLeft);
      var offsetInSeconds = (getTimezoneOffsetInMilliseconds(dateRight) - getTimezoneOffsetInMilliseconds(dateLeft)) / 1000;
      var minutes = Math.round((seconds - offsetInSeconds) / 60);
      var months; // 0 up to 2 mins

      if (minutes < 2) {
        if (options.includeSeconds) {
          if (seconds < 5) {
            return locale$1.formatDistance('lessThanXSeconds', 5, localizeOptions);
          } else if (seconds < 10) {
            return locale$1.formatDistance('lessThanXSeconds', 10, localizeOptions);
          } else if (seconds < 20) {
            return locale$1.formatDistance('lessThanXSeconds', 20, localizeOptions);
          } else if (seconds < 40) {
            return locale$1.formatDistance('halfAMinute', null, localizeOptions);
          } else if (seconds < 60) {
            return locale$1.formatDistance('lessThanXMinutes', 1, localizeOptions);
          } else {
            return locale$1.formatDistance('xMinutes', 1, localizeOptions);
          }
        } else {
          if (minutes === 0) {
            return locale$1.formatDistance('lessThanXMinutes', 1, localizeOptions);
          } else {
            return locale$1.formatDistance('xMinutes', minutes, localizeOptions);
          }
        } // 2 mins up to 0.75 hrs

      } else if (minutes < 45) {
        return locale$1.formatDistance('xMinutes', minutes, localizeOptions); // 0.75 hrs up to 1.5 hrs
      } else if (minutes < 90) {
        return locale$1.formatDistance('aboutXHours', 1, localizeOptions); // 1.5 hrs up to 24 hrs
      } else if (minutes < MINUTES_IN_DAY) {
        var hours = Math.round(minutes / 60);
        return locale$1.formatDistance('aboutXHours', hours, localizeOptions); // 1 day up to 1.75 days
      } else if (minutes < MINUTES_IN_ALMOST_TWO_DAYS) {
        return locale$1.formatDistance('xDays', 1, localizeOptions); // 1.75 days up to 30 days
      } else if (minutes < MINUTES_IN_MONTH) {
        var days = Math.round(minutes / MINUTES_IN_DAY);
        return locale$1.formatDistance('xDays', days, localizeOptions); // 1 month up to 2 months
      } else if (minutes < MINUTES_IN_TWO_MONTHS) {
        months = Math.round(minutes / MINUTES_IN_MONTH);
        return locale$1.formatDistance('aboutXMonths', months, localizeOptions);
      }

      months = differenceInMonths(dateRight, dateLeft); // 2 months up to 12 months

      if (months < 12) {
        var nearestMonth = Math.round(minutes / MINUTES_IN_MONTH);
        return locale$1.formatDistance('xMonths', nearestMonth, localizeOptions); // 1 year up to max Date
      } else {
        var monthsSinceStartOfYear = months % 12;
        var years = Math.floor(months / 12); // N years up to 1 years 3 months

        if (monthsSinceStartOfYear < 3) {
          return locale$1.formatDistance('aboutXYears', years, localizeOptions); // N years 3 months up to N years 9 months
        } else if (monthsSinceStartOfYear < 9) {
          return locale$1.formatDistance('overXYears', years, localizeOptions); // N years 9 months up to N year 12 months
        } else {
          return locale$1.formatDistance('almostXYears', years + 1, localizeOptions);
        }
      }
    }

    /* src\components\Article.svelte generated by Svelte v3.16.7 */
    const file$7 = "src\\components\\Article.svelte";

    // (95:4) {:else}
    function create_else_block$2(ctx) {
    	let p;
    	let t_value = /*data*/ ctx[0].status + "";
    	let t;
    	let p_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", p_class_value = "" + (null_to_empty(`tag ${/*data*/ ctx[0].status}`) + " svelte-lts9f7"));
    			add_location(p, file$7, 95, 6, 1787);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].status + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && p_class_value !== (p_class_value = "" + (null_to_empty(`tag ${/*data*/ ctx[0].status}`) + " svelte-lts9f7"))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(95:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (91:4) {#if data.status === 'accepted'}
    function create_if_block$4(ctx) {
    	let p;
    	let t0;
    	let t1_value = formatDistance$1(new Date(/*data*/ ctx[0].modifiedAt), new Date(), { addSuffix: true }) + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Since: ");
    			t1 = text(t1_value);
    			attr_dev(p, "class", "svelte-lts9f7");
    			add_location(p, file$7, 91, 6, 1658);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = formatDistance$1(new Date(/*data*/ ctx[0].modifiedAt), new Date(), { addSuffix: true }) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(91:4) {#if data.status === 'accepted'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let article;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div;
    	let h1;
    	let t1_value = /*data*/ ctx[0].firstName + "";
    	let t1;
    	let t2;
    	let t3_value = /*data*/ ctx[0].lastName + "";
    	let t3;
    	let t4;
    	let t5;
    	let article_class_value;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].status === "accepted") return create_if_block$4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			article = element("article");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = space();
    			if_block.c();
    			t5 = space();
    			if (default_slot) default_slot.c();
    			if (img.src !== (img_src_value = /*data*/ ctx[0].avatar || "/images/default-avatar.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = `${/*data*/ ctx[0].firstName} ${/*data*/ ctx[0].lastName}`);
    			attr_dev(img, "class", "svelte-lts9f7");
    			add_location(img, file$7, 85, 2, 1427);
    			attr_dev(h1, "class", "svelte-lts9f7");
    			add_location(h1, file$7, 89, 4, 1571);
    			attr_dev(div, "class", "detailWrap svelte-lts9f7");
    			add_location(div, file$7, 88, 2, 1541);
    			attr_dev(article, "class", article_class_value = "" + (null_to_empty(/*klass*/ ctx[1]) + " svelte-lts9f7"));
    			add_location(article, file$7, 84, 0, 1400);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, img);
    			append_dev(article, t0);
    			append_dev(article, div);
    			append_dev(div, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(div, t4);
    			if_block.m(div, null);
    			append_dev(article, t5);

    			if (default_slot) {
    				default_slot.m(article, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*data*/ 1 && img.src !== (img_src_value = /*data*/ ctx[0].avatar || "/images/default-avatar.png")) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*data*/ 1 && img_alt_value !== (img_alt_value = `${/*data*/ ctx[0].firstName} ${/*data*/ ctx[0].lastName}`)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if ((!current || dirty & /*data*/ 1) && t1_value !== (t1_value = /*data*/ ctx[0].firstName + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*data*/ 1) && t3_value !== (t3_value = /*data*/ ctx[0].lastName + "")) set_data_dev(t3, t3_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}

    			if (!current || dirty & /*klass*/ 2 && article_class_value !== (article_class_value = "" + (null_to_empty(/*klass*/ ctx[1]) + " svelte-lts9f7"))) {
    				attr_dev(article, "class", article_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if_block.d();
    			if (default_slot) default_slot.d(detaching);
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
    	let { data } = $$props;
    	let { klass = "" } = $$props;
    	const writable_props = ["data", "klass"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Article> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("klass" in $$props) $$invalidate(1, klass = $$props.klass);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { data, klass };
    	};

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("klass" in $$props) $$invalidate(1, klass = $$props.klass);
    	};

    	return [data, klass, $$scope, $$slots];
    }

    class Article extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { data: 0, klass: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Article",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<Article> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get klass() {
    		throw new Error("<Article>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set klass(value) {
    		throw new Error("<Article>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Views\Mates\index.svelte generated by Svelte v3.16.7 */
    const file$8 = "src\\Views\\Mates\\index.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (138:2) {#if searchResult}
    function create_if_block_2(ctx) {
    	let current;

    	const article = new Article({
    			props: {
    				data: /*searchResult*/ ctx[1],
    				klass: "searchResult",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(article.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(article, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const article_changes = {};
    			if (dirty & /*searchResult*/ 2) article_changes.data = /*searchResult*/ ctx[1];

    			if (dirty & /*$$scope*/ 4096) {
    				article_changes.$$scope = { dirty, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(article, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(138:2) {#if searchResult}",
    		ctx
    	});

    	return block;
    }

    // (139:4) <Article data={searchResult} klass="searchResult">
    function create_default_slot_1(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	const button = new Button({
    			props: {
    				type: "button",
    				klass: "primary small inline right",
    				text: "Invite"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*sendRequest*/ ctx[5]);

    	const block = {
    		c: function create() {
    			if (!default_slot) {
    				create_component(button.$$.fragment);
    			}

    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (!default_slot) {
    				mount_component(button, target, anchor);
    			}

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4096) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (!default_slot) {
    				destroy_component(button, detaching);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(139:4) <Article data={searchResult} klass=\\\"searchResult\\\">",
    		ctx
    	});

    	return block;
    }

    // (171:2) {:else}
    function create_else_block$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No Mates";
    			add_location(p, file$8, 171, 4, 4845);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(171:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (152:2) {#if $user.mates.length}
    function create_if_block$5(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$user*/ ctx[2].mates;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$user, updateRequest, $$scope*/ 4116) {
    				each_value = /*$user*/ ctx[2].mates;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(152:2) {#if $user.mates.length}",
    		ctx
    	});

    	return block;
    }

    // (155:8) {#if mate.senderId != $user._id && mate.status === 'pending'}
    function create_if_block_1$3(ctx) {
    	let t;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[10](/*mate*/ ctx[13], ...args);
    	}

    	const button0 = new Button({
    			props: {
    				type: "button",
    				klass: "positive small inline right pill",
    				text: "Accept"
    			},
    			$$inline: true
    		});

    	button0.$on("click", click_handler);

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[11](/*mate*/ ctx[13], ...args);
    	}

    	const button1 = new Button({
    			props: {
    				type: "button",
    				klass: "negative small inline pill",
    				text: "Decline"
    			},
    			$$inline: true
    		});

    	button1.$on("click", click_handler_1);

    	const block = {
    		c: function create() {
    			if (!default_slot) {
    				create_component(button0.$$.fragment);
    				t = space();
    				create_component(button1.$$.fragment);
    			}

    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (!default_slot) {
    				mount_component(button0, target, anchor);
    				insert_dev(target, t, anchor);
    				mount_component(button1, target, anchor);
    			}

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4096) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[12], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (!default_slot) {
    				destroy_component(button0, detaching);
    				if (detaching) detach_dev(t);
    				destroy_component(button1, detaching);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(155:8) {#if mate.senderId != $user._id && mate.status === 'pending'}",
    		ctx
    	});

    	return block;
    }

    // (154:6) <Article data={mate} klass="card">
    function create_default_slot(ctx) {
    	let t;
    	let current;
    	let if_block = /*mate*/ ctx[13].senderId != /*$user*/ ctx[2]._id && /*mate*/ ctx[13].status === "pending" && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*mate*/ ctx[13].senderId != /*$user*/ ctx[2]._id && /*mate*/ ctx[13].status === "pending") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
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
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(154:6) <Article data={mate} klass=\\\"card\\\">",
    		ctx
    	});

    	return block;
    }

    // (153:4) {#each $user.mates as mate}
    function create_each_block$1(ctx) {
    	let current;

    	const article = new Article({
    			props: {
    				data: /*mate*/ ctx[13],
    				klass: "card",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(article.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(article, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const article_changes = {};
    			if (dirty & /*$user*/ 4) article_changes.data = /*mate*/ ctx[13];

    			if (dirty & /*$$scope, $user*/ 4100) {
    				article_changes.$$scope = { dirty, ctx };
    			}

    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(article, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(153:4) {#each $user.mates as mate}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let form;
    	let updating_value;
    	let t4;
    	let t5;
    	let t6;
    	let section;
    	let current_block_type_index;
    	let if_block1;
    	let current;

    	function input_value_binding(value) {
    		/*input_value_binding*/ ctx[9].call(null, value);
    	}

    	let input_props = {
    		type: "email",
    		name: "email",
    		labelText: "Email",
    		required: false,
    		hideLabel: true,
    		placeholder: "Email"
    	};

    	if (/*email*/ ctx[0] !== void 0) {
    		input_props.value = /*email*/ ctx[0];
    	}

    	const input = new Input({ props: input_props, $$inline: true });
    	binding_callbacks.push(() => bind(input, "value", input_value_binding));

    	const button = new Button({
    			props: {
    				type: "submit",
    				klass: "primary",
    				text: "Search"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*search*/ ctx[3]);
    	let if_block0 = /*searchResult*/ ctx[1] && create_if_block_2(ctx);
    	const if_block_creators = [create_if_block$5, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$user*/ ctx[2].mates.length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Mates";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Find a mate by searching for their email address.";
    			t3 = space();
    			form = element("form");
    			create_component(input.$$.fragment);
    			t4 = space();
    			create_component(button.$$.fragment);
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			section = element("section");
    			if_block1.c();
    			add_location(h1, file$8, 123, 0, 3510);
    			add_location(p, file$8, 124, 0, 3526);
    			attr_dev(form, "class", "card");
    			add_location(form, file$8, 126, 0, 3586);
    			attr_dev(section, "class", "mates");
    			add_location(section, file$8, 150, 0, 4143);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, form, anchor);
    			mount_component(input, form, null);
    			append_dev(form, t4);
    			mount_component(button, form, null);
    			append_dev(form, t5);
    			if (if_block0) if_block0.m(form, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, section, anchor);
    			if_blocks[current_block_type_index].m(section, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const input_changes = {};

    			if (!updating_value && dirty & /*email*/ 1) {
    				updating_value = true;
    				input_changes.value = /*email*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			input.$set(input_changes);

    			if (/*searchResult*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(form, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(section, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(form);
    			destroy_component(input);
    			destroy_component(button);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(section);
    			if_blocks[current_block_type_index].d();
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
    	let $token;
    	let $user;
    	validate_store(token, "token");
    	component_subscribe($$self, token, $$value => $$invalidate(6, $token = $$value));
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(2, $user = $$value));
    	let email = "";
    	let searchResult;

    	const updateUser = data => {
    		fetch(`http://localhost:3001/user/update/${data._id}`, {
    			method: "put",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			},
    			body: JSON.stringify(data)
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				return alert.set({ message: result.message, type: "error" });
    			}

    			if (data._id === $user._id) {
    				user.set(result);
    				$$invalidate(0, email = "");
    			} else {
    				$$invalidate(1, searchResult = null);
    			}

    			alert.set({ message: "Request sent", type: "success" });
    		}).catch(e => {
    			alert.set({ message: e, type: "error" });
    			console.log(e);
    		});
    	};

    	const search = () => {
    		if (!email) {
    			return alert.set({
    				message: "Please an email address",
    				type: "error"
    			});
    		}

    		fetch(`http://localhost:3001/user/find/`, {
    			method: "post",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			},
    			body: JSON.stringify({ email })
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				return alert.set({ message: result.message, type: "error" });
    			}

    			$$invalidate(1, searchResult = result);
    		}).catch(e => {
    			alert.set({ message: e, type: "error" });
    			console.log(e);
    		});
    	};

    	const updateRequest = (status, userId) => {
    		fetch(`http://localhost:3001/user/mateRequest/${$user._id}`, {
    			method: "put",
    			headers: {
    				"Content-Type": "application/json",
    				Authorization: `bearer: ${$token}`
    			},
    			body: JSON.stringify({ _id: userId, status })
    		}).then(res => res.json()).then(result => {
    			if (result.statusCode) {
    				return alert.set({ message: result.message, type: "error" });
    			}

    			alert.set({
    				message: `Request ${status}`,
    				type: "success"
    			});

    			user.set(result);
    		}).catch(e => {
    			alert.set({ message: e, type: "error" });
    			console.log(e);
    		});
    	};

    	const sendRequest = () => {
    		const updatedUser = $user;
    		const now = new Date();

    		updatedUser.mates.unshift({
    			_id: searchResult._id,
    			status: "pending",
    			firstName: searchResult.firstName,
    			lastName: searchResult.lastName,
    			displayName: searchResult.displayName,
    			avatar: "/images/default-avatar.png",
    			senderId: $user._id,
    			createdAt: now,
    			modifiedAt: now
    		});

    		searchResult.mates.unshift({
    			_id: $user._id,
    			status: "pending",
    			firstName: $user.firstName,
    			lastName: $user.lastName,
    			displayName: $user.displayName,
    			avatar: "/images/default-avatar.png",
    			senderId: $user._id,
    			createdAt: now,
    			modifiedAt: now
    		});

    		updateUser(updatedUser);
    		updateUser(searchResult);
    	};

    	let { $$slots = {}, $$scope } = $$props;

    	function input_value_binding(value) {
    		email = value;
    		$$invalidate(0, email);
    	}

    	const click_handler = (mate, e) => updateRequest("accepted", mate._id);
    	const click_handler_1 = (mate, e) => updateRequest("declined", mate._id);

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("searchResult" in $$props) $$invalidate(1, searchResult = $$props.searchResult);
    		if ("$token" in $$props) token.set($token = $$props.$token);
    		if ("$user" in $$props) user.set($user = $$props.$user);
    	};

    	return [
    		email,
    		searchResult,
    		$user,
    		search,
    		updateRequest,
    		sendRequest,
    		$token,
    		updateUser,
    		$$slots,
    		input_value_binding,
    		click_handler,
    		click_handler_1,
    		$$scope
    	];
    }

    class Mates extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mates",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    // import AddMate from './Views/Mates/add.svelte';


    const routes = new Map();

    routes.set('/', Login);
    routes.set('/profile', Profile);
    routes.set('/threads', Threads);
    routes.set('/mates', Mates);

    /* src\components\Header.svelte generated by Svelte v3.16.7 */
    const file$9 = "src\\components\\Header.svelte";

    // (126:2) {#if showNav}
    function create_if_block$6(ctx) {
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
    			attr_dev(div0, "class", "bar bar-one svelte-f7yykm");
    			add_location(div0, file$9, 127, 6, 2386);
    			attr_dev(div1, "class", "bar bar-two svelte-f7yykm");
    			add_location(div1, file$9, 128, 6, 2421);
    			attr_dev(div2, "class", "bar bar-three svelte-f7yykm");
    			add_location(div2, file$9, 129, 6, 2456);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*$navOpen*/ ctx[1] ? "open" : "") + " svelte-f7yykm"));
    			add_location(button, file$9, 126, 4, 2316);
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
    			if (dirty & /*$navOpen*/ 2 && button_class_value !== (button_class_value = "" + (null_to_empty(/*$navOpen*/ ctx[1] ? "open" : "") + " svelte-f7yykm"))) {
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(126:2) {#if showNav}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
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
    	let if_block = /*showNav*/ ctx[0] && create_if_block$6(ctx);

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
    			attr_dev(span0, "class", "dot dot-one svelte-f7yykm");
    			add_location(span0, file$9, 120, 6, 2169);
    			attr_dev(span1, "class", "dot dot-two svelte-f7yykm");
    			add_location(span1, file$9, 121, 6, 2205);
    			attr_dev(span2, "class", "dot dot-three svelte-f7yykm");
    			add_location(span2, file$9, 122, 6, 2241);
    			attr_dev(span3, "class", "dotAnim svelte-f7yykm");
    			add_location(span3, file$9, 119, 4, 2139);
    			attr_dev(h1, "class", "svelte-f7yykm");
    			add_location(h1, file$9, 117, 2, 2118);
    			attr_dev(header, "class", "svelte-f7yykm");
    			add_location(header, file$9, 116, 0, 2106);
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
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$6(ctx);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $navOpen;
    	validate_store(navOpen, "navOpen");
    	component_subscribe($$self, navOpen, $$value => $$invalidate(1, $navOpen = $$value));
    	let { showNav = false } = $$props;

    	const handleClick = () => {
    		navOpen.set(!$navOpen);
    	};

    	const writable_props = ["showNav"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("showNav" in $$props) $$invalidate(0, showNav = $$props.showNav);
    	};

    	$$self.$capture_state = () => {
    		return { showNav, $navOpen };
    	};

    	$$self.$inject_state = $$props => {
    		if ("showNav" in $$props) $$invalidate(0, showNav = $$props.showNav);
    		if ("$navOpen" in $$props) navOpen.set($navOpen = $$props.$navOpen);
    	};

    	return [showNav, $navOpen, handleClick];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { showNav: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$a.name
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
    const file$a = "src\\components\\RouterLink.svelte";

    function create_fragment$b(ctx) {
    	let a;
    	let t_value = /*page*/ ctx[0].name + "";
    	let t;
    	let a_href_value;
    	let link_action;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*page*/ ctx[0].path);
    			attr_dev(a, "class", "svelte-oyolmb");
    			add_location(a, file$a, 17, 0, 258);

    			dispose = [
    				action_destroyer(link_action = link.call(null, a)),
    				listen_dev(a, "click", /*click_handler*/ ctx[1], false, false, false)
    			];
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
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { page = { path: "/", name: "Login" } } = $$props;
    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RouterLink> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		navOpen.set(false);
    	};

    	$$self.$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => {
    		return { page };
    	};

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	return [page, click_handler];
    }

    class RouterLink extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RouterLink",
    			options,
    			id: create_fragment$b.name
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
    const file$b = "src\\components\\Navigation.svelte";

    function create_fragment$c(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let t0;
    	let li1;
    	let t1;
    	let li2;
    	let t2;
    	let nav_class_value;
    	let current;

    	const routerlink0 = new RouterLink({
    			props: {
    				page: { path: "/profile", name: "Profile" }
    			},
    			$$inline: true
    		});

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

    	const button = new Button({
    			props: {
    				type: "submit",
    				klass: "primary",
    				text: "Logout"
    			},
    			$$inline: true
    		});

    	button.$on("click", /*logout*/ ctx[1]);

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
    			t2 = space();
    			create_component(button.$$.fragment);
    			attr_dev(li0, "class", "svelte-1uvbnou");
    			add_location(li0, file$b, 55, 4, 1181);
    			attr_dev(li1, "class", "svelte-1uvbnou");
    			add_location(li1, file$b, 58, 4, 1269);
    			attr_dev(li2, "class", "svelte-1uvbnou");
    			add_location(li2, file$b, 61, 4, 1353);
    			attr_dev(ul, "class", "svelte-1uvbnou");
    			add_location(ul, file$b, 54, 2, 1171);
    			attr_dev(nav, "class", nav_class_value = "" + (null_to_empty(/*$navOpen*/ ctx[0] ? "show" : "") + " svelte-1uvbnou"));
    			add_location(nav, file$b, 53, 0, 1131);
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
    			append_dev(nav, t2);
    			mount_component(button, nav, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$navOpen*/ 1 && nav_class_value !== (nav_class_value = "" + (null_to_empty(/*$navOpen*/ ctx[0] ? "show" : "") + " svelte-1uvbnou"))) {
    				attr_dev(nav, "class", nav_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(routerlink0.$$.fragment, local);
    			transition_in(routerlink1.$$.fragment, local);
    			transition_in(routerlink2.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(routerlink0.$$.fragment, local);
    			transition_out(routerlink1.$$.fragment, local);
    			transition_out(routerlink2.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(routerlink0);
    			destroy_component(routerlink1);
    			destroy_component(routerlink2);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $navOpen;
    	validate_store(navOpen, "navOpen");
    	component_subscribe($$self, navOpen, $$value => $$invalidate(0, $navOpen = $$value));

    	const logout = () => {
    		sessionStorage.removeItem("token");
    		localStorage.removeItem("user");
    		localStorage.removeItem("logout");
    		navOpen.set(false);
    		isLoggedIn.set(false);
    		user.set();
    		alert.set();
    		push("/");
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$navOpen" in $$props) navOpen.set($navOpen = $$props.$navOpen);
    	};

    	return [$navOpen, logout];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.16.7 */
    const file$c = "src\\App.svelte";

    // (45:0) {#if $isLoggedIn}
    function create_if_block_2$1(ctx) {
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(45:0) {#if $isLoggedIn}",
    		ctx
    	});

    	return block;
    }

    // (51:2) {#if $alert}
    function create_if_block_1$4(ctx) {
    	let current;
    	const usermessage = new UserMessage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(usermessage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(usermessage, target, anchor);
    			current = true;
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
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(51:2) {#if $alert}",
    		ctx
    	});

    	return block;
    }

    // (57:2) {:else}
    function create_else_block$4(ctx) {
    	let current;
    	const login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(57:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:2) {#if $user}
    function create_if_block$7(ctx) {
    	let current;
    	const router = new Router({ props: { routes }, $$inline: true });
    	router.$on("routeLoaded", /*routeLoaded*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(55:2) {#if $user}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let title_value;
    	let t0;
    	let t1;
    	let t2;
    	let main;
    	let t3;
    	let current_block_type_index;
    	let if_block2;
    	let current;
    	let dispose;
    	document.title = title_value = "Convo - " + /*$location*/ ctx[1];

    	const header = new Header({
    			props: { showNav: /*$isLoggedIn*/ ctx[2] },
    			$$inline: true
    		});

    	let if_block0 = /*$isLoggedIn*/ ctx[2] && create_if_block_2$1(ctx);
    	let if_block1 = /*$alert*/ ctx[3] && create_if_block_1$4(ctx);
    	const if_block_creators = [create_if_block$7, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$user*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			main = element("main");
    			if (if_block1) if_block1.c();
    			t3 = space();
    			if_block2.c();
    			attr_dev(main, "id", "pageContent");
    			add_location(main, file$c, 48, 0, 1184);
    			dispose = listen_dev(window, "storage", /*syncLogOut*/ ctx[4], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t3);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$location*/ 2) && title_value !== (title_value = "Convo - " + /*$location*/ ctx[1])) {
    				document.title = title_value;
    			}

    			const header_changes = {};
    			if (dirty & /*$isLoggedIn*/ 4) header_changes.showNav = /*$isLoggedIn*/ ctx[2];
    			header.$set(header_changes);

    			if (/*$isLoggedIn*/ ctx[2]) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				} else {
    					transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$alert*/ ctx[3]) {
    				if (!if_block1) {
    					if_block1 = create_if_block_1$4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t3);
    				} else {
    					transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			if (if_block1) if_block1.d();
    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $user;
    	let $location;
    	let $isLoggedIn;
    	let $alert;
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	validate_store(location, "location");
    	component_subscribe($$self, location, $$value => $$invalidate(1, $location = $$value));
    	validate_store(isLoggedIn, "isLoggedIn");
    	component_subscribe($$self, isLoggedIn, $$value => $$invalidate(2, $isLoggedIn = $$value));
    	validate_store(alert, "alert");
    	component_subscribe($$self, alert, $$value => $$invalidate(3, $alert = $$value));

    	const syncLogOut = evt => {
    		if (evt.key === "logout") {
    			sessionStorage.removeItem("token");
    			localStorage.removeItem("user");
    			localStorage.removeItem("logout");
    			push("/");
    		}
    	};

    	const routeLoaded = () => {
    		alert.set();
    	};

    	onMount(() => {
    		if (!$user) {
    			if (localStorage.getItem("user")) {
    				user.set(JSON.parse(localStorage.getItem("user")));
    			} else {
    				push("/");
    			}
    		}
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$user" in $$props) user.set($user = $$props.$user);
    		if ("$location" in $$props) location.set($location = $$props.$location);
    		if ("$isLoggedIn" in $$props) isLoggedIn.set($isLoggedIn = $$props.$isLoggedIn);
    		if ("$alert" in $$props) alert.set($alert = $$props.$alert);
    	};

    	return [$user, $location, $isLoggedIn, $alert, syncLogOut, routeLoaded];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
