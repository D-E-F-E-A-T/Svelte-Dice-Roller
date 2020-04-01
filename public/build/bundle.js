
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.20.1 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let br0;
    	let t0;
    	let center;
    	let div0;
    	let h1;
    	let t2;
    	let br1;
    	let t3;
    	let div1;
    	let h30;
    	let t4;
    	let t5;
    	let t6;
    	let button0;
    	let t8;
    	let button1;
    	let t10;
    	let h31;
    	let t11;
    	let t12;
    	let t13;
    	let button2;
    	let t15;
    	let button3;
    	let t17;
    	let h32;
    	let t18;
    	let t19;
    	let button4;
    	let t21;
    	let br2;
    	let t22;
    	let div2;
    	let h50;
    	let t23;
    	let a0;
    	let t25;
    	let h51;
    	let t26;
    	let a1;
    	let t28;
    	let br3;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			br0 = element("br");
    			t0 = space();
    			center = element("center");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "dice roller demo";
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			div1 = element("div");
    			h30 = element("h3");
    			t4 = text("roll ");
    			t5 = text(/*diceNum*/ ctx[0]);
    			t6 = space();
    			button0 = element("button");
    			button0.textContent = "+";
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "-";
    			t10 = space();
    			h31 = element("h3");
    			t11 = text("d");
    			t12 = text(/*dieType*/ ctx[1]);
    			t13 = space();
    			button2 = element("button");
    			button2.textContent = "+";
    			t15 = space();
    			button3 = element("button");
    			button3.textContent = "-";
    			t17 = space();
    			h32 = element("h3");
    			t18 = text(/*result*/ ctx[2]);
    			t19 = space();
    			button4 = element("button");
    			button4.textContent = "ROLL";
    			t21 = space();
    			br2 = element("br");
    			t22 = space();
    			div2 = element("div");
    			h50 = element("h5");
    			t23 = text("To learn how to build Svelte apps, visit the\n        ");
    			a0 = element("a");
    			a0.textContent = "Svelte tutorial";
    			t25 = space();
    			h51 = element("h5");
    			t26 = text("For the code in this demo, visit\n        ");
    			a1 = element("a");
    			a1.textContent = "Sammi Turner's GitHub";
    			t28 = space();
    			br3 = element("br");
    			add_location(br0, file, 102, 2, 1510);
    			attr_dev(h1, "class", "svelte-1s9nltz");
    			add_location(h1, file, 105, 6, 1544);
    			attr_dev(div0, "class", "svelte-1s9nltz");
    			add_location(div0, file, 104, 4, 1532);
    			add_location(br1, file, 107, 4, 1585);
    			attr_dev(h30, "class", "svelte-1s9nltz");
    			add_location(h30, file, 109, 6, 1621);
    			attr_dev(button0, "class", "svelte-1s9nltz");
    			add_location(button0, file, 110, 6, 1651);
    			attr_dev(button1, "class", "svelte-1s9nltz");
    			add_location(button1, file, 111, 6, 1693);
    			attr_dev(h31, "class", "svelte-1s9nltz");
    			add_location(h31, file, 112, 6, 1737);
    			attr_dev(button2, "class", "svelte-1s9nltz");
    			add_location(button2, file, 113, 6, 1763);
    			attr_dev(button3, "class", "svelte-1s9nltz");
    			add_location(button3, file, 114, 6, 1806);
    			attr_dev(h32, "class", "svelte-1s9nltz");
    			add_location(h32, file, 115, 6, 1851);
    			attr_dev(button4, "class", "svelte-1s9nltz");
    			add_location(button4, file, 116, 6, 1875);
    			attr_dev(div1, "class", "dice svelte-1s9nltz");
    			add_location(div1, file, 108, 4, 1596);
    			add_location(br2, file, 118, 4, 1932);
    			attr_dev(a0, "href", "https://svelte.dev/tutorial");
    			add_location(a0, file, 122, 8, 2021);
    			attr_dev(h50, "class", "svelte-1s9nltz");
    			add_location(h50, file, 120, 6, 1955);
    			attr_dev(a1, "href", "https://github.com/sammi-turner");
    			add_location(a1, file, 126, 8, 2151);
    			attr_dev(h51, "class", "svelte-1s9nltz");
    			add_location(h51, file, 124, 6, 2097);
    			attr_dev(div2, "class", "svelte-1s9nltz");
    			add_location(div2, file, 119, 4, 1943);
    			add_location(br3, file, 129, 4, 2246);
    			add_location(center, file, 103, 2, 1519);
    			attr_dev(main, "class", "svelte-1s9nltz");
    			add_location(main, file, 101, 0, 1501);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, br0);
    			append_dev(main, t0);
    			append_dev(main, center);
    			append_dev(center, div0);
    			append_dev(div0, h1);
    			append_dev(center, t2);
    			append_dev(center, br1);
    			append_dev(center, t3);
    			append_dev(center, div1);
    			append_dev(div1, h30);
    			append_dev(h30, t4);
    			append_dev(h30, t5);
    			append_dev(div1, t6);
    			append_dev(div1, button0);
    			append_dev(div1, t8);
    			append_dev(div1, button1);
    			append_dev(div1, t10);
    			append_dev(div1, h31);
    			append_dev(h31, t11);
    			append_dev(h31, t12);
    			append_dev(div1, t13);
    			append_dev(div1, button2);
    			append_dev(div1, t15);
    			append_dev(div1, button3);
    			append_dev(div1, t17);
    			append_dev(div1, h32);
    			append_dev(h32, t18);
    			append_dev(div1, t19);
    			append_dev(div1, button4);
    			append_dev(center, t21);
    			append_dev(center, br2);
    			append_dev(center, t22);
    			append_dev(center, div2);
    			append_dev(div2, h50);
    			append_dev(h50, t23);
    			append_dev(h50, a0);
    			append_dev(div2, t25);
    			append_dev(div2, h51);
    			append_dev(h51, t26);
    			append_dev(h51, a1);
    			append_dev(center, t28);
    			append_dev(center, br3);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*upNum*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*downNum*/ ctx[5], false, false, false),
    				listen_dev(button2, "click", /*upType*/ ctx[6], false, false, false),
    				listen_dev(button3, "click", /*downType*/ ctx[7], false, false, false),
    				listen_dev(button4, "click", /*rollDice*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*diceNum*/ 1) set_data_dev(t5, /*diceNum*/ ctx[0]);
    			if (dirty & /*dieType*/ 2) set_data_dev(t12, /*dieType*/ ctx[1]);
    			if (dirty & /*result*/ 4) set_data_dev(t18, /*result*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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
    	let { diceNum = 1 } = $$props;
    	let { dieType = 4 } = $$props;
    	let { result = 0 } = $$props;

    	function rollDice() {
    		var i;
    		var roll;
    		$$invalidate(2, result = 0);

    		for (i = 0; i < diceNum; i++) {
    			roll = Math.ceil(Math.random() * dieType);
    			$$invalidate(2, result += roll);
    		}
    	}

    	function upNum() {
    		$$invalidate(0, diceNum++, diceNum);
    	}

    	function downNum() {
    		$$invalidate(0, diceNum--, diceNum);

    		if (diceNum < 1) {
    			$$invalidate(0, diceNum = 1);
    		}
    	}

    	function upType() {
    		$$invalidate(1, dieType += 2);

    		if (dieType > 20) {
    			$$invalidate(1, dieType = 4);
    		}

    		if (dieType > 12) {
    			$$invalidate(1, dieType = 20);
    		}
    	}

    	function downType() {
    		$$invalidate(1, dieType -= 2);

    		if (dieType == 18) {
    			$$invalidate(1, dieType = 12);
    		}

    		if (dieType < 4) {
    			$$invalidate(1, dieType = 20);
    		}
    	}

    	const writable_props = ["diceNum", "dieType", "result"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$set = $$props => {
    		if ("diceNum" in $$props) $$invalidate(0, diceNum = $$props.diceNum);
    		if ("dieType" in $$props) $$invalidate(1, dieType = $$props.dieType);
    		if ("result" in $$props) $$invalidate(2, result = $$props.result);
    	};

    	$$self.$capture_state = () => ({
    		diceNum,
    		dieType,
    		result,
    		rollDice,
    		upNum,
    		downNum,
    		upType,
    		downType
    	});

    	$$self.$inject_state = $$props => {
    		if ("diceNum" in $$props) $$invalidate(0, diceNum = $$props.diceNum);
    		if ("dieType" in $$props) $$invalidate(1, dieType = $$props.dieType);
    		if ("result" in $$props) $$invalidate(2, result = $$props.result);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [diceNum, dieType, result, rollDice, upNum, downNum, upType, downType];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { diceNum: 0, dieType: 1, result: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get diceNum() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set diceNum(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dieType() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dieType(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get result() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set result(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
