/**
 * Application architecture
 */
(function() {
    'use strict';

    var api = {};
    var defaults = {
        debug: false
    };
    var conf;

    if ( _ === undefined || Backbone === undefined || jQuery === undefined ) return;

    var resolved = Deferred().resolve().promise();
    var rejected = Deferred().reject().promise();
    var when = $.when;
    var appReady = Deferred();

    // Prepare the mediator
    _.extend(api, EventEmitter());

    // Emit event when appReady resolves - the app is starting.
    appReady.done(function () {
        api.trigger('appReady');
    });

    /**
     * Simple event emitter service to use for the mediator.
     * Copy of Backbone.Events but without methods causing tight coupling.
     */
    function EventEmitter() {
        return _.pick(Backbone.Events, ['on', 'off', 'once', 'trigger']);
    }

    function Deferred() {
        return new $.Deferred();
    }

    function setValueByNamespace( obj, namespace, value ) {
        var tree = namespace.split('.');
        var key = tree.shift();

        while ( tree.length ) {
            if ( obj[key] !== undefined ) {
                obj = obj[key];
            } else {
                obj = obj[key] = {};
            }
            key = tree.shift();
        }

        if ( obj[key] === undefined ) {
            obj[key] = value;
            return true;
        } else {
            return false;
        }
    }

    function getValueByNameSpace( obj, namespace ) {
        var tree = namespace.split('.');
        var key = tree.shift();

        while ( tree.length ) {
            if ( obj[key] === undefined ) return;
            obj = obj[key];
            key = tree.shift();
        }

        return obj[namespace];
    }

    /**
     * Module registration
     * Extend the app object as you wish
     */
    function register( namespace, moduleApi ) {
        if ( !namespace ) return new Error('Namespace missing: ');
        var newModule = setValueByNamespace(this, namespace, moduleApi);

        return (newModule) ? new Error('Module exists already: ', namespace): this;
    }

    // return a deep copy of conf
    // to avoid (accidental) mutations.
    function getConfig( namespace ) {
        var config = getValueByNameSpace(conf, namespace);
        if ( !config ) return;

        return deepCopy(config);
    }

    // Deep copy of an object
    // alternatively use JSON.parse(JSON.stringify(obj), but it won't copy functions!
    function deepCopy( obj ) {
        return $.extend(true, {}, obj);
    }

    function init( options ) {
        // apply custom config if present
        conf = _.extend({}, defaults, options);

        // Event debugging
        if ( conf.debug === true ) {
            this.on('all', function( event ) {
                console.log(event);
            });
        }

        // expose getConfig function as the config is now available
        api.getConfig = getConfig;

        // call all ready callbacks as soon as the DOM is ready
        $(function() {
            appReady.resolve();
        });
    }

    // expose to global scope
    window.app = _.extend(api, {
        init: init,
        register: register,
        ready: function( cb ) {
            appReady.done.call(appReady, cb);
        },

        // offer DOM manipulation service, for now its jQuery
        '$': jQuery,
        // offer a consistent AJAX-requests interface
        ajax: jQuery.ajax,

        // utility function to deep-copy objects
        deepCopy: deepCopy,

        // offer simple promise handling
        Deferred: Deferred,
        resolved: resolved,
        rejected: rejected,
        when: when,

        // offer a consistent event emitting service
        Events: EventEmitter
    });
}());
