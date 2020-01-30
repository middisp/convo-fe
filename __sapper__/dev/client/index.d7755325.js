import { S as SvelteComponentDev, i as init, d as dispatch_dev, s as safe_not_equal, x as binding_callbacks, y as bind, z as create_component, A as claim_component, B as mount_component, C as add_flush_callback, D as transition_in, E as transition_out, F as destroy_component, a as space, e as element, t as text, G as query_selector_all, g as detach_dev, h as claim_space, c as claim_element, b as children, f as claim_text, j as attr_dev, k as add_location, l as insert_dev, m as append_dev, H as check_outros, I as user, J as isLoggedIn, K as curRoute, L as token, M as group_outros } from './client.104c6a62.js';
import { I as Input, B as Button, U as UserMessage } from './UserMessage.0f647b6c.js';

/* src\routes\index.svelte generated by Svelte v3.18.1 */
const file = "src\\routes\\index.svelte";

// (59:0) {#if alert}
function create_if_block(ctx) {
	let updating_alert;
	let current;

	function usermessage_alert_binding(value) {
		/*usermessage_alert_binding*/ ctx[5].call(null, value);
	}

	let usermessage_props = {};

	if (/*alert*/ ctx[2] !== void 0) {
		usermessage_props.alert = /*alert*/ ctx[2];
	}

	const usermessage = new UserMessage({ props: usermessage_props, $$inline: true });
	binding_callbacks.push(() => bind(usermessage, "alert", usermessage_alert_binding));

	const block = {
		c: function create() {
			create_component(usermessage.$$.fragment);
		},
		l: function claim(nodes) {
			claim_component(usermessage.$$.fragment, nodes);
		},
		m: function mount(target, anchor) {
			mount_component(usermessage, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const usermessage_changes = {};

			if (!updating_alert && dirty & /*alert*/ 4) {
				updating_alert = true;
				usermessage_changes.alert = /*alert*/ ctx[2];
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
		id: create_if_block.name,
		type: "if",
		source: "(59:0) {#if alert}",
		ctx
	});

	return block;
}

function create_fragment(ctx) {
	let t0;
	let h1;
	let t1;
	let t2;
	let t3;
	let form;
	let updating_value;
	let t4;
	let updating_value_1;
	let t5;
	let current;
	let if_block = /*alert*/ ctx[2] && create_if_block(ctx);

	function input0_value_binding(value) {
		/*input0_value_binding*/ ctx[6].call(null, value);
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
		/*input1_value_binding*/ ctx[7].call(null, value_1);
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
			t0 = space();
			h1 = element("h1");
			t1 = text("Hi!");
			t2 = space();
			if (if_block) if_block.c();
			t3 = space();
			form = element("form");
			create_component(input0.$$.fragment);
			t4 = space();
			create_component(input1.$$.fragment);
			t5 = space();
			create_component(button.$$.fragment);
			this.h();
		},
		l: function claim(nodes) {
			const head_nodes = query_selector_all("[data-svelte=\"svelte-p4g4ak\"]", document.head);
			head_nodes.forEach(detach_dev);
			t0 = claim_space(nodes);
			h1 = claim_element(nodes, "H1", { class: true });
			var h1_nodes = children(h1);
			t1 = claim_text(h1_nodes, "Hi!");
			h1_nodes.forEach(detach_dev);
			t2 = claim_space(nodes);
			if (if_block) if_block.l(nodes);
			t3 = claim_space(nodes);
			form = claim_element(nodes, "FORM", { action: true });
			var form_nodes = children(form);
			claim_component(input0.$$.fragment, form_nodes);
			t4 = claim_space(form_nodes);
			claim_component(input1.$$.fragment, form_nodes);
			t5 = claim_space(form_nodes);
			claim_component(button.$$.fragment, form_nodes);
			form_nodes.forEach(detach_dev);
			this.h();
		},
		h: function hydrate() {
			document.title = "Convo - login";
			attr_dev(h1, "class", "svelte-l33yj5");
			add_location(h1, file, 57, 0, 1433);
			attr_dev(form, "action", "post");
			add_location(form, file, 61, 0, 1497);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, h1, anchor);
			append_dev(h1, t1);
			insert_dev(target, t2, anchor);
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, t3, anchor);
			insert_dev(target, form, anchor);
			mount_component(input0, form, null);
			append_dev(form, t4);
			mount_component(input1, form, null);
			append_dev(form, t5);
			mount_component(button, form, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (/*alert*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);
					transition_in(if_block, 1);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(t3.parentNode, t3);
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
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(h1);
			if (detaching) detach_dev(t2);
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(t3);
			if (detaching) detach_dev(form);
			destroy_component(input0);
			destroy_component(input1);
			destroy_component(button);
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
	let email = "";
	let password = "";
	let alert;

	const saveToSession = data => {
		window.sessionStorage.setItem("token", data);
	};

	const login = () => {
		if (!email || !password) {
			return error = "Please provide your login details";
		}

		fetch("http://localhost:3000/login", {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password })
		}).then(res => res.json()).then(result => {
			if (result.statusCode) {
				$$invalidate(2, alert = { message: result.message, type: "error" });
			} else {
				user.set(result.user);
				isLoggedIn.set(true);
				curRoute.set("/threads");
				token.set(result.token);
				window.history.pushState({ path: "/threads" }, "", window.location.origin + "/threads");
			}
		}).catch(e => {
			$$invalidate(2, alert = { message: e, type: "error" });
			console.log(e);
		});
	};

	function usermessage_alert_binding(value) {
		alert = value;
		$$invalidate(2, alert);
	}

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
		if ("alert" in $$props) $$invalidate(2, alert = $$props.alert);
	};

	return [
		email,
		password,
		alert,
		login,
		saveToSession,
		usermessage_alert_binding,
		input0_value_binding,
		input1_value_binding
	];
}

class Routes extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Routes",
			options,
			id: create_fragment.name
		});
	}
}

export default Routes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguZDc3NTUzMjUuanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9yb3V0ZXMvaW5kZXguc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XHJcbiAgaW1wb3J0IHsgY3VyUm91dGUsIHVzZXIsIGlzTG9nZ2VkSW4sIHRva2VuIH0gZnJvbSBcIi4uL3N0b3JlLmpzXCI7XHJcblxyXG4gIGltcG9ydCBJbnB1dCBmcm9tIFwiLi4vY29tcG9uZW50cy9JbnB1dC5zdmVsdGVcIjtcclxuICBpbXBvcnQgQnV0dG9uIGZyb20gXCIuLi9jb21wb25lbnRzL0J1dHRvbi5zdmVsdGVcIjtcclxuICBpbXBvcnQgVXNlck1lc3NhZ2UgZnJvbSBcIi4uL2NvbXBvbmVudHMvVXNlck1lc3NhZ2Uuc3ZlbHRlXCI7XHJcblxyXG4gIGxldCBlbWFpbCA9IFwiXCI7XHJcbiAgbGV0IHBhc3N3b3JkID0gXCJcIjtcclxuICBsZXQgYWxlcnQ7XHJcblxyXG4gIGNvbnN0IHNhdmVUb1Nlc3Npb24gPSBkYXRhID0+IHtcclxuICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFwidG9rZW5cIiwgZGF0YSk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgbG9naW4gPSAoKSA9PiB7XHJcbiAgICBpZiAoIWVtYWlsIHx8ICFwYXNzd29yZCkge1xyXG4gICAgICByZXR1cm4gKGVycm9yID0gXCJQbGVhc2UgcHJvdmlkZSB5b3VyIGxvZ2luIGRldGFpbHNcIik7XHJcbiAgICB9XHJcbiAgICBmZXRjaChcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9sb2dpblwiLCB7XHJcbiAgICAgIG1ldGhvZDogXCJwb3N0XCIsXHJcbiAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbCwgcGFzc3dvcmQgfSlcclxuICAgIH0pXHJcbiAgICAgIC50aGVuKHJlcyA9PiByZXMuanNvbigpKVxyXG4gICAgICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgICAgIGlmIChyZXN1bHQuc3RhdHVzQ29kZSkge1xyXG4gICAgICAgICAgYWxlcnQgPSB7IG1lc3NhZ2U6IHJlc3VsdC5tZXNzYWdlLCB0eXBlOiBcImVycm9yXCIgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdXNlci5zZXQocmVzdWx0LnVzZXIpO1xyXG4gICAgICAgICAgaXNMb2dnZWRJbi5zZXQodHJ1ZSk7XHJcbiAgICAgICAgICBjdXJSb3V0ZS5zZXQoXCIvdGhyZWFkc1wiKTtcclxuICAgICAgICAgIHRva2VuLnNldChyZXN1bHQudG9rZW4pO1xyXG4gICAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKFxyXG4gICAgICAgICAgICB7IHBhdGg6IFwiL3RocmVhZHNcIiB9LFxyXG4gICAgICAgICAgICBcIlwiLFxyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgXCIvdGhyZWFkc1wiXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGUgPT4ge1xyXG4gICAgICAgIGFsZXJ0ID0geyBtZXNzYWdlOiBlLCB0eXBlOiBcImVycm9yXCIgfTtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgICAgfSk7XHJcbiAgfTtcclxuPC9zY3JpcHQ+XHJcblxyXG48c3R5bGU+XHJcbiAgaDEge1xyXG4gICAgbWFyZ2luLXRvcDogMDtcclxuICB9XHJcbjwvc3R5bGU+XHJcblxyXG48c3ZlbHRlOmhlYWQ+XHJcbiAgPHRpdGxlPkNvbnZvIC0gbG9naW48L3RpdGxlPlxyXG48L3N2ZWx0ZTpoZWFkPlxyXG5cclxuPGgxPkhpITwvaDE+XHJcbnsjaWYgYWxlcnR9XHJcbiAgPFVzZXJNZXNzYWdlIGJpbmQ6YWxlcnQgLz5cclxuey9pZn1cclxuPGZvcm0gYWN0aW9uPVwicG9zdFwiPlxyXG4gIDxJbnB1dFxyXG4gICAgdHlwZT1cImVtYWlsXCJcclxuICAgIG5hbWU9XCJlbWFpbFwiXHJcbiAgICBsYWJlbFRleHQ9XCJFbWFpbFwiXHJcbiAgICBiaW5kOnZhbHVlPXtlbWFpbH1cclxuICAgIHJlcXVpcmVkPVwicmVxdWlyZWRcIiAvPlxyXG4gIDxJbnB1dFxyXG4gICAgdHlwZT1cInBhc3N3b3JkXCJcclxuICAgIG5hbWU9XCJwYXNzd29yZFwiXHJcbiAgICBsYWJlbFRleHQ9XCJQYXNzd29yZFwiXHJcbiAgICBiaW5kOnZhbHVlPXtwYXNzd29yZH1cclxuICAgIHJlcXVpcmVkPVwicmVxdWlyZWRcIiAvPlxyXG4gIDxCdXR0b25cclxuICAgIHR5cGU9XCJzdWJtaXRcIlxyXG4gICAgb246Y2xpY2s9e2xvZ2lufVxyXG4gICAgZGlzYWJsZWQ9eyFlbWFpbC5sZW5ndGggfHwgIXBhc3N3b3JkLmxlbmd0aH1cclxuICAgIGtsYXNzPVwicHJpbWFyeVwiXHJcbiAgICB0ZXh0PVwiTG9naW5cIiAvPlxyXG48L2Zvcm0+XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3lCQTZFZSxHQUFLLElBQUMsTUFBTSxrQkFBSyxHQUFRLElBQUMsTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzJFQUFoQyxHQUFLLElBQUMsTUFBTSxrQkFBSyxHQUFRLElBQUMsTUFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLQXRFekMsS0FBSyxHQUFHLEVBQUU7S0FDVixRQUFRLEdBQUcsRUFBRTtLQUNiLEtBQUs7O09BRUgsYUFBYSxHQUFHLElBQUk7RUFDeEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUk7OztPQUd2QyxLQUFLO09BQ0osS0FBSyxLQUFLLFFBQVE7VUFDYixLQUFLLEdBQUcsbUNBQW1DOzs7RUFFckQsS0FBSyxDQUFDLDZCQUE2QjtHQUNqQyxNQUFNLEVBQUUsTUFBTTtHQUNkLE9BQU8sSUFBSSxjQUFjLEVBQUUsa0JBQWtCO0dBQzdDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssRUFBRSxRQUFRO0tBRXJDLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksSUFDcEIsSUFBSSxDQUFDLE1BQU07T0FDTixNQUFNLENBQUMsVUFBVTtvQkFDbkIsS0FBSyxLQUFLLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPOztJQUVoRCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJO0lBQ3BCLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSTtJQUNuQixRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVU7SUFDdkIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztJQUN0QixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FDcEIsSUFBSSxFQUFFLFVBQVUsSUFDbEIsRUFBRSxFQUNGLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLFVBQVU7O0tBSXhDLEtBQUssQ0FBQyxDQUFDO21CQUNOLEtBQUssS0FBSyxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPO0dBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OyJ9
