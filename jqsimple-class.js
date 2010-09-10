/*! jqsimple-class - Copyright Eskild Hustvedt 2010
 * License: GNU LGPLv3 */
/*
 * jQsimple-class is a simple JavaScript class decleration for JQuery
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

(function($){

	var classIdentifierNumbers = 0;

	/*
	 * Main class constructor
	 */
	var classBuilder = function(objs)
	{
		if (!$.isArray(objs))
		{
			objs = $extend({},objs);
			objs = addClassIdentifiers(objs);
		}

		var resultClass = function ()
		{
			var resultObj = this,
				classArgs = arguments,
				jClassMeta = { obj: resultObj, destructors: [] },
				constructors = [];
			
			// Extend all parents and call their constructors
			$each(objs, function (i,o) {
				// Extend it
				$extend(true,resultObj,o);
				// Set constr to the constructor for quick access
				var constr = resultObj._constructor,
				// Set destr to the destructor for quick access
					destr = resultObj._destructor;
				// If the constructor exists and is not the same as the
				// previously called one, push it onto the constructors
				// array
				if(constr)
					constructors.push(constr);

				// Save the destructor if it exists
				if(destr)
					jClassMeta.destructors.push(destr);
			});

			$each(constructors,function (index, constr)
				   {
					   constr.apply(resultObj,classArgs);
				   });

			// Extend our class instance object
			resultObj.jClass = $extend({ _meta: jClassMeta }, classSharedMethods);
			resultObj.destroy = destructor;
		};

		// Extend our class object
		$extend(resultClass,{
			objs: objs,
			jClass: $extend({_meta: { obj: resultClass}},classBaseMethods, classSharedMethods)
		});
		return resultClass;
	},
	/*
	 * Ensure that the supplied value is an array
	 */
		strictArray = function (arr)
	{
		if(!$.isArray(arr))
			arr = [ arr ];
		return arr;
	},
		addClassIdentifiers = function(arr)
	{
		arr = strictArray(arr);
		$each(arr, function(index, object)
		{
			addSingleClassIdentifier(object);
		});
		return arr;
	},
		addSingleClassIdentifier = function (object)
	{
		if(object.jClass == undefined)
			object.jClass = {};
		if(object.jClass.identifier == undefined)
		{
			classIdentifierNumbers++;
			object.jClass.identifier = classIdentifierNumbers;
		}
		return object;
	};
	/*
	 * Function used to resolve inheritance trees.
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
		resolveInheritance = function (objs)
	{
		var resolved = [];
		var resolvedIDs = [];
		objs = strictArray(objs);
		var iter = 0;
		// The value of entry supplied to the unction is unused, declaring
		// it in the function() declaration works as well as anything, and
		// helps with minifying.
		$each(strictArray(objs), function (entry, object)
			   {
				   iter++;
				   var identifier = object.jClass.identifier;

				   // Find object's index in the resolved array
				   entry = $.inArray(identifier,resolvedIDs);
				   if(entry > 0)
				   {
					   resolved.splice(entry,1);
					   resolvedIDs.splice(entry,1);
				   }
				   resolvedIDs.unshift(identifier);
				   resolved.unshift(object);
			   });
		return resolved;
	},
	// Function used to build a constructor function for classes, setting up
	// inheritance and calling constructors defined in the class.
	/*
	 * Function performing the magic to extend an existing class
	 */
		extendClass = function(parents, child, callback)
	{
		var entries = [];
		$each(strictArray(parents), function(index, entry)
			   {
				   $.merge(entries, entry.objs);
			   });
		// Make a copy of all of the objects, and run the callback on it
		$each(entries, function(index,entry)
		{
			entries[index] = entry = $extend({},entry);
			if(callback)
				callback.call(null,entry);
		});

		child = addSingleClassIdentifier($extend({},child));
		// Unshift the child onto it, we assume it is pure
		entries.unshift(child);
		// Resolve inheritance
		entries = resolveInheritance(entries);
		// Perform normal class building
		return classBuilder(entries);
	},

    /*
     * Base class for the class objects themselves
     */
		classBaseMethods =
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
    },

    /*
     * Shared base class
     */
    	classSharedMethods =
    {
		// Our version number
        version: "0.1"
    },

    /*
     * Destructor method for instances
     */
     	destructor = function ()
     {
         var self = this;
         $each(self.jClass._meta.destructors, function (i,o) {
             o.apply(self);
         });
         $each(self, function(i,o) {
             delete self[i];
         });
     },

	 /*
	  * Helpers for improved minifying
	  */
	 	$extend = $.extend,
		$each	= $.each;


    /*
     * Base class for class *instances*
     */
	 /* (unused for now), modify extend() call in resultClass when it
	 * is in use.
    var classInstanceMethods =
    {
    };
	*/

    $extend(classBuilder, {

		// Method for extending an existing class
        extend: extendClass,

		// Method for extending an existing class without inheriting
		// constructors
        extendS: function (orig,extension)
        {
			return extendClass(orig,extension, function(object)
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

			addSingleClassIdentifier(obj);

            // Extend our class object
            $extend(resultClass,{
                objs: [ obj ],
                jClass: $extend({_meta: {virtual:true}},classBaseMethods, classSharedMethods)
            });
            return resultClass;
		}

    }, classSharedMethods);

	window.jClass = classBuilder;
})(jQuery);
