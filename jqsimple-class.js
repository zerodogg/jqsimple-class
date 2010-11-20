/*! jQsimple-class - Copyright Eskild Hustvedt 2010
 * License: GNU LGPLv3 */
/*
 * jQsimple-class is a simple JavaScript class decleration library
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
 * outside of jQsimple-class. Those methods are subject to constant API
 * changes, removal and even renaming for minified releases (ie. _meta is
 * minified to _m).
 * **
 */

(function($) {

    /*
     * Class identifier number. Used to help resolve inheritance chains
     */
    var classIdentifierNumbers = 0,

     /*
      * Helpers for improved minifying, we're simply storing references
      * to various methods from the jQuery object.
      */
        $extend = $.extend,
        $merge = $.merge,
        $isArray = $.isArray,
        $each = $.each,

    /*
     * Main class constructor
     */
        classBuilder = function(objs)
    {
        /*
         * If objs is an array, we assume they are already copies, and
         * that they have class identifiers.
         * If not, we make a copy of the objs object, add identifiers
         * and convert it to an array.
         */
        if (!$isArray(objs))
            objs = [ addSingleClassIdentifier($extend({},objs)) ];

        /*
         * Constructor for the resulting class. Takes care of building an
         * instance, and calls jQsimple-class _constructors
         */
        var resultClass = function()
        {
            var resultObj = this,
                jClassMeta = { obj: resultObj, destructors: [] },
                constructors = [],
                // Declared for use later in this scope
                constructor = 0;

            if (! (resultObj instanceof resultClass))
                throw('Class must be instantiated');

            // Extend all parents and call their constructors
            $each(objs, function(i, o) {
                // Extend it
                $extend(true, resultObj, o);
                // Set constr to the constructor for quick access
                var constr = resultObj._constructor,
                // Set destr to the destructor for quick access
                    destr = resultObj._destructor;
                // If the constructor exists and is not the same as the
                // previously called one, push it onto the constructors
                // array
                if (constr)
                    constructors.push(constr);

                // Save the destructor if it exists
                if (destr)
                    jClassMeta.destructors.push(destr);
            });

            // Run all constructors
            for( ; constructor < constructors.length ; constructor++)
            {
                constructors[constructor].apply(resultObj,arguments);
            }

            // Extend our class instance object
            resultObj.jClass = $extend({ _meta: jClassMeta }, classSharedMethods);
            resultObj.destroy = destructor;
        };

        // Extend our class object
        $extend(resultClass, {
            objs: objs,
            jClass: $extend({_meta: { obj: resultClass}},classBaseMethods, classSharedMethods)
        });
        return resultClass;
    },
    /*
     * Ensure that the supplied value is an array
     */
        strictArray = function(arr)
    {
        return $isArray(arr) ? arr : [arr];
    },
    /*
     * Add a class identifier to the hash/object supplied.
     * jQsimple-class uses the identifier when resolving inheritance.
     * This is needed because {} != {}, and we make copies of each object
     * before the inheritance is being resolved, thus we need some quick
     * way to find out if two objects are the same.
     */
        addSingleClassIdentifier = function(object)
    {
        if (!object.jClass)
            object.jClass = {};
        if (!object.jClass.identifier)
        {
            classIdentifierNumbers++;
            object.jClass.identifier = classIdentifierNumbers;
        }
        return object;
    },
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
        resolveInheritance = function(objs)
    {
        var resolved = [],
            resolvedIDs = [];

        /*
         * First we reverse the objs array, then we loop through it
         * and remove any duplicates found at the end.
         *
         * The logic is that a class should be at the last point in the
         * inheritance chain that it can. So, given our example above:
         *
         * It starts with: ABDCD
         * Reverses: DCDBA
         * Loops through and pushes onto the array:
         *    1 - pushes D
         *    2 - pushes C
         *    3 - Sees that D has already been pushed, so skips it
         *    4 - Pushes B
         *    5 - Pushes A
         * Resulting in: DCBA
         * This tells jQsimple-Class to first run D's constructor, then
         * apply C's methods (replacing any of D's) then run C's constructor,
         * then the same for B and A.
         */
        $each( strictArray(objs).reverse(), function (i, object)
        {
            var identifier = object.jClass.identifier;
            if ($.inArray(identifier, resolvedIDs) === -1)
            {
                resolved.push(object);
                resolvedIDs.push(identifier);
            }
        });
        return resolved;
    },
    /* Function used to build a constructor function for classes, setting up
     * inheritance and calling constructors defined in the class. */
        extendClass = function(parents, child, callback)
    {
        var entries = [];
        $each(strictArray(parents), function(index, entry)
               {
                   // It is in reverse order for easy iteration when constructing,
                   // we need to reverse() it back again.
                   $merge(entries,
                            $merge([], entry.objs).reverse()
                        );
               });
        // Make a copy of all of the objects, and run the callback on them if one
        // was supplied
        $each(entries, function(index, entry)
        {
            entries[index] = entry = $extend({},entry);
            if (callback)
                callback.call(null, entry);
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
            // This bit of code allows us to supply both a raw JS object,
            // or a jQsimple-class object to inlineExtend, and have them both
            // just work.
            try
            {
                if (append.jClass._meta.virtual)
                    append = append.objs[0];
            } catch (e) { }
            // Copy obj
            append = $extend({},append);
            // Remove constructor and destructor if present
            removeConstructAndDestruct(append);
            // Finally, add it to the inheritance list
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
        version: '0.1.2'
    },

    /*
     * Destructor method for instances
     *
     * Handles calling each jQsimple-class destructor in turn and then
     * emptying the object.
     */
        destructor = function()
     {
         var self = this;
         $each(self.jClass._meta.destructors, function(i, o) {
             o.apply(self);
         });
         $each(self, function(i, o) {
             delete self[i];
         });
     },

     /*
      * Function that removes destructors and constructors from an object
      */
        removeConstructAndDestruct = function(obj)
     {
            obj._destructor = obj._constructor = null;
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

    // Add methods to the global jClass object
    $extend(classBuilder, {

        // Method for extending an existing class
        extend: extendClass,

        // Method for extending an existing class without inheriting
        // constructors
        extendS: function(orig, extension)
        {
            return extendClass(orig, extension, removeConstructAndDestruct);
        },

        virtual: function(obj)
        {
            var resultClass = function()
            {
                throw ('Attempted to instantiate virtual class');
            };

            // Copy obj
            obj = $extend({},obj);
            // Remove constructors and destructors from it
            removeConstructAndDestruct(obj);

            // Add a class identifier
            addSingleClassIdentifier(obj);

            // Extend the resulting object
            $extend(resultClass, {
                objs: [obj],
                jClass: $extend({_meta: {virtual: true}},classBaseMethods, classSharedMethods)
            });
            return resultClass;
        }

        // Inherit shared methods
    }, classSharedMethods);

    // Finally, declare jClass as a global function.
    window.jClass = classBuilder;
})(jQuery);
