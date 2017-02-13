/* global OC.Backbone, Handlebars, Promise, _ */

/**
 * @copyright 2017 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @author 2017 Christoph Wurst <christoph@winzerhof-wurst.at>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function(OC, $, _, Handlebars) {
	'use strict';

	var LOADING_TEMPLATE = ''
			+ '<div class="emptycontent">'
			+ '    <a class="icon-loading"></a>'
			+ '    <h2>{{loadingText}}</h2>'
			+ '</div>';
	var CONTENT_TEMPLATE = ''
			+ '<div>'
			+ '    <input id="contactsmenu-search" type="search" placeholder="Search contacts …" value="{{searchTerm}}">'
			+ '    {{#unless contacts.length}}<div class="emptycontent">' + t('core', 'No contacts found.') + '</div>{{/unless}}'
			+ '    <div id="contactsmenu-contacts"></div>'
			+ '</div>';
	var CONTACT_TEMPLATE = ''
			+ '<div class="avatar"></div>'
			+ '<div class="body">'
			+ '    <div class="full-name">{{contact.fullName}}</div>'
			+ '    <div class="last-message">{{contact.lastMessage}}</div>'
			+ '</div>'
			+ '<a class="top-action {{contact.topAction.icon}}" href="{{contact.topAction.hyperlink}}"></a>'
			+ '<span class="other-actions icon-more"></span>'
			+ '<div class="popovermenu bubble menu">'
			+ '    <ul>'
			+ '        {{#each contact.actions}}'
			+ '        <li><span class="{{icon}}"><a href="{{hyperlink}}">{{title}}</a></span></li>'
			+ '        {{/each}}'
			+ '        <li><span class="icon-info"><a href="/apps/contacts/#uri">Details</a></span></li>'
			+ '    </ul>'
			+ '</div>';

	/**
	 * @class Contact
	 */
	var Contact = OC.Backbone.Model.extend({
		defaults: {
			fullName: '',
			lastMessage: '',
			actions: []
		}
	});

	/**
	 * @class ContactCollection
	 */
	var ContactCollection = OC.Backbone.Collection.extend({
		model: Contact
	});

	/**
	 * @class ContactsListView
	 */
	var ContactsListView = OC.Backbone.View.extend({

		/** @type {ContactsCollection} */
		_collection: undefined,

		/**
		 * @param {object} options
		 * @returns {undefined}
		 */
		initialize: function(options) {
			this._collection = options.collection;
		},

		/**
		 * @returns {self}
		 */
		render: function() {
			var self = this;
			self.$el.html('');

			self._collection.forEach(function(contact) {
				var item = new ContactsListItemView({
					model: contact
				});
				item.render();
				self.$el.append(item.$el);
			});

			return self;
		}
	});

	/**
	 * @class CotnactsListItemView
	 */
	var ContactsListItemView = OC.Backbone.View.extend({

		/** @type {string} */
		className: 'contact',

		/** @type {undefined|function} */
		_template: undefined,

		/** @type {Contact} */
		_model: undefined,

		events: {
			'click .icon-more': '_onToggleActionsMenu'
		},

		/**
		 * @param {object} data
		 * @returns {undefined}
		 */
		template: function(data) {
			if (!this._template) {
				this._template = Handlebars.compile(CONTACT_TEMPLATE);
			}
			return this._template(data);
		},

		/**
		 * @param {object} options
		 * @returns {undefined}
		 */
		initialize: function(options) {
			this._model = options.model;
		},

		/**
		 * @returns {self}
		 */
		render: function() {
			this.$el.html(this.template({
				contact: this._model.toJSON()
			}));
			this.delegateEvents();

			this.$('.avatar').imageplaceholder(this._model.get('fullName'));

			return this;
		},

		_onToggleActionsMenu: function() {
			this.$('.menu').toggleClass('open');
		}
	});

	/**
	 * @class ContactsMenuView
	 */
	var ContactsMenuView = OC.Backbone.View.extend({

		/** @type {undefined|function} */
		_loadingTemplate: undefined,

		/** @type {undefined|function} */
		_contentTemplate: undefined,

		/** @type {undefined|ContactCollection} */
		_contacts: undefined,

		_onSearch: _.debounce(function() {
			this.trigger('search', this.$('#contactsmenu-search').val());
		}, 700),

		events: {
			'keyup #contactsmenu-search': '_onSearch'
		},

		/**
		 * @param {object} data
		 * @returns {string}
		 */
		loadingTemplate: function(data) {
			if (!this._loadingTemplate) {
				this._loadingTemplate = Handlebars.compile(LOADING_TEMPLATE);
			}
			return this._loadingTemplate(data);
		},

		/**
		 * @param {object} data
		 * @returns {string}
		 */
		contentTemplate: function(data) {
			if (!this._contentTemplate) {
				this._contentTemplate = Handlebars.compile(CONTENT_TEMPLATE);
			}
			return this._contentTemplate(data);
		},

		/**
		 * @param {object} options
		 * @returns {undefined}
		 */
		initialize: function(options) {
			this.options = options;
		},

		/**
		 * @returns {undefined}
		 */
		showLoading: function(text) {
			this._contacts = undefined;
			this.render({
				loading: true,
				loadingText: text
			});
		},

		/**
		 * @param {Backbone.Collection} contacts
		 * @param {string} searchTerm
		 * @returns {undefined}
		 */
		showContacts: function(contacts, searchTerm) {
			this._contacts = contacts;
			this.render({
				loading: false,
				searchTerm: searchTerm,
				contacts: contacts
			});
		},

		/**
		 * @param {object} data
		 * @returns {self}
		 */
		render: function(data) {
			if (!!data.loading) {
				this.$el.html(this.loadingTemplate(data));
			} else {
				var list = new ContactsListView({
					collection: data.contacts
				});
				list.render();
				this.$el.html(this.contentTemplate(data));
				this.$('#contactsmenu-contacts').html(list.$el);

				// Focus search
				this.$('#contactsmenu-search').focus();
			}

			return this;
		},

	});

	/**
	 * @param {array} options
	 * @class ContactsMenu
	 */
	var ContactsMenu = function(options) {
		this.initialize(options);
	};

	ContactsMenu.prototype = {
		/** @type {jQuery} */
		$el: undefined,

		/** @type {jQuery} */
		_$trigger: undefined,

		/** @type {boolean} */
		_open: false,

		/** @type {ContactsMenuView} */
		_view: undefined,

		/** @type {Promise} */
		_contactsPromise: undefined,

		/**
		 * @param {array} options
		 * @returns {undefined}
		 */
		initialize: function(options) {
			var self = this;

			self.$el = options.el;
			self._$trigger = options.trigger;

			this._view = new ContactsMenuView({
				el: self.$el
			});
			this._view.on('search', function(searchTerm) {
				self._loadContacts(searchTerm);
			});

			this._$trigger.click(function(event) {
				event.preventDefault();
				self._toggleVisibility();
			});
		},

		/**
		 * @returns {undefined}
		 */
		_toggleVisibility: function() {
			if (!this._open) {
				this._loadContacts();
				this.$el.addClass('open');
				this._open = true;
			} else {
				this.$el.removeClass('open');
				this._open = false;
			}
		},

		_getContacts: function(searchTerm) {
			var url = OC.generateUrl('/contactsmenu/contacts');
			return Promise.resolve($.ajax(url, {
				method: 'GET',
				data: {
					filter: searchTerm
				}
			})).then(function(data) {
				// Convert to Backbone collection
				return new ContactCollection(data);
			});
		},

		_loadContacts: function(searchTerm) {
			var self = this;

			if (!self._contactsPromise) {
				self._contactsPromise = self._getContacts(searchTerm);
			}

			if (_.isUndefined(searchTerm) || searchTerm === '') {
				self._view.showLoading(t('core', 'Loading your contacts …'));
			} else {
				self._view.showLoading(t('core', 'Looking for {term} …', {
					term: searchTerm
				}));
			}
			self._contactsPromise.then(function(contacts) {
				self._view.showContacts(contacts, searchTerm);
			}, function(e) {
				console.error('could not load contacts', e);
			}).then(function() {
				// Delete promise, so that contactes are fetched again when the
				// menu is opened the next time.
				delete self._contactsPromise;
			});
		}
	};

	OC.ContactsMenu = ContactsMenu;

})(OC, $, _, Handlebars);
