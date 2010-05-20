/*!
 * A simple JavaScript class declaration for JQuery.
 * Copyright (C) Eskild Hustvedt 2010 for Portu Media & Communications
 * Licensed under the GNU LGPLv3
*/
/*
 *
 * This library is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 * See README.pod for documentation
 * 
 * vim: set expandtab tabstop=4 shiftwidth=4 :
 *
 * **
 * NOTE: Any method or attribute prefixed by _ should NEVER be used in code
 * outside of jqsimple-class. Those methods are subject to constant API
 * changes, removal and even renaming for minified releases (ie. _meta is
 * minified to _m).
 * **
 */

/*
 * Main class constructor
 */
function jClass (obj)
{
	// Perform class building
    return jClass._buildConstructor(obj);
}

(function($){
    /*
     * Base class for the class objects themselves
     */
    var classBaseMethods =
    {
        /*
         * Method for extending existing classes with new methods
         */
        inlineExtend: function(append)
        {
			try
			{
				if(append.jClass._meta.virtual)
					append = append.objs[0];
			} catch(e) { }
            this._meta.obj.objs.unshift(append);
			return this;
        }
    };

    /*
     * Base class for class *instances*
     */
	 /* (unused for now), modify extend() call in resultClass when it
	 * is in use.
    var classInstanceMethods =
    {
    };
	*/

    /*
     * Shared base class
     */
    var classSharedMethods =
    {
		// Our version number
        version: "0.1"
    };

    /*
     * Destructor method for instances
     */
     var destructor = function ()
     {
         var self = this;
         $.each(self.jClass._meta.destructors, function (i,o) {
             o.apply(self);
         });
         $.each(self, function(i,o) {
             delete self[i];
         });
         return;
     };

    $.extend(jClass, {

		// Method for extending an existing class
        extend: function (orig,extension)
        {
			return this._extendClass(orig,extension);
        },

		// Method for extending an existing class without inheriting
		// constructors
        extendS: function (orig,extension)
        {
			return this._extendClass(orig,extension, function(object)
									 {
										 object._destructor = object._constructor = null;
									 });
        },

		virtual: function (obj)
		{
			var resultClass = function ()
			{
				throw('Attempted to instantiate virtual class');
			};
            // Extend our class object
            $.extend(resultClass,{
                objs: [ obj ],
                jClass: $.extend({_meta: {virtual:true}},classBaseMethods, classSharedMethods)
            });
            return resultClass;
		},

		_extendClass: function(parents, child, callback)
		{
			var entries = [];
			$.each(this._strictArray(parents), function(index, entry)
				   {
					   $.merge(entries, entry.objs);
				   });
			// Make a copy of all of the objects, and run the callback on it
			$.each(entries, function(index,entry)
			{
				entries[index] = entry = $.extend({},entry);
				if(callback)
					this.call(callback,entry);
			});
			// Unshift the child onto it, we assume it is pure
            entries.unshift(child);
			// Resolve inheritance
			entries = this._resolveInheritance(entries);
			// Perform normal class building
            return this._buildConstructor(entries);
		},

		_strictArray: function (arr)
		{
			if(!( arr instanceof Array))
				arr = [ arr ];
			return arr;
		},

		/*
		 * Method used to resolve inheritance trees.
		 *
		 * The classic diamond pattern:
		 *    <A>
		 *   /   \
		 * <B>   <C>
		 *   \   /
		 *    <D>
		 *
		 * Which is "ABDCD" when this method is called resolves to
		 * ABCD.
		 */
		_resolveInheritance: function (objs)
		{
			var resolved = [];
			$.each(this._strictArray(objs), function (index, object)
				   {
					   var entry = $.inArray(object,resolved);
					   if(entry > 0)
						   resolved = resolved.slice(entry,entry);
					   resolved.unshift(object);
				   });
			return resolved;
		},

		// Method used to build a constructor function for classes, setting up
		// inheritance and calling constructors defined in the class.
        _buildConstructor: function(objs)
        {
			// Ensures objs is an array.
			objs = this._strictArray(objs);

            var resultClass = function ()
            {
                var resultObj = this;
                var classArgs = arguments;
                var jClassMeta = { obj: resultObj, destructors: [] };
				var constructors = [];
                
                // Extend all parents and call their constructors
                $.each(objs, function (i,o) {
                    // Extend it
                    $.extend(true,resultObj,o);
                    // Set constr to the constructor for quick access
                    var constr = resultObj._constructor;
                    // If the constructor exists and is not the same as the
                    // previously called one, push it onto the constructors
					// array
                    if(constr)
						constructors.push(constr);

                    // Set destr to the destructor for quick access
                    var destr = resultObj._destructor;
                    // Save the destructor if it exists
                    if(destr)
                        jClassMeta.destructors.push(destr);
                });

				$.each(constructors,function (index, constr)
					   {
						   constr.apply(resultObj,classArgs);
					   });

                // Extend our class instance object
                resultObj.jClass = $.extend({ _meta: jClassMeta }, classSharedMethods);
                resultObj.destroy = destructor;
            };

            // Extend our class object
            $.extend(resultClass,{
                objs: objs,
                jClass: $.extend({_meta: { obj: resultClass}},classBaseMethods, classSharedMethods)
            });
            return resultClass;
        }
    }, classSharedMethods);
})(jQuery);
