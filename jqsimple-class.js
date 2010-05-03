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
 */

/*
 * Main class constructor
 */
function jClass (obj)
{
    return jClass._buildConstructor(obj);
}

(function(){
    // Our version number
    var version = '0.1';

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
					append = append.objs.shift();
			} catch(e) { }
			delete append.constructor;
            this._meta.obj.objs.unshift(append);
			return this;
        }
    };

    /*
     * Base class for class *instances*
     */
    var classInstanceMethods =
    {
    };

    /*
     * Shared base class
     */
    var classSharedMethods =
    {
        version: version
    };

    /*
     * Destructor method for instances
     */
     var destructor = function ()
     {
         var self = this;
         jQuery.each(self.jClass._meta.destructors, function (i,o) {
             o.apply(self);
         });
         jQuery.each(self, function(i,o) {
             o = null;
             delete self[i];
         });
         return null;
     };

    jQuery.extend(jClass, {

        version: version,

		// Method for extending an existing class
        extend: function (orig,extension)
        {
            var objs = orig.objs;
            objs.push(extension);
            return jClass._buildConstructor(objs);
        },

		// Method for extending an existing class without inheriting
		// constructors
        extendS: function (orig,extension)
        {
            var objs = orig.objs;
            jQuery.each(objs, function (i,o) {
                delete o.constructor;
                delete o.destructor;
            });
            objs.push(extension);
            return jClass._buildConstructor(objs);
        },

		virtual: function (obj)
		{
			var resultClass = function ()
			{
				throw('Attempted to instantiate virtual class');
			};
            // Extend our class object
            jQuery.extend(resultClass,{
                objs: [ obj ],
                jClass: jQuery.extend({_meta: {virtual:true}},classBaseMethods, classSharedMethods)
            });
            return resultClass;
		},

		// Method used to build a constructor function for classes, setting up
		// inheritance and calling constructors defined in the class.
        _buildConstructor: function(objs)
        {
			if(!( objs instanceof Array))
				objs = [ objs ];
            var resultClass = function ()
            {
                var resultObj = this;
                var classArgs = arguments;
                var prevConstructor = classArgs.callee;
                var prevDestructor = null;
                var jClassMeta = { obj: resultObj, destructors: [] };
                // Delete any initial constructor
				delete this.constructor;
                
                // Extend all parents and call their constructors
                jQuery.each(objs, function (i,o) {
                    // Extend it
                    jQuery.extend(true,resultObj,o);
                    // Set constr to the constructor for quick access
                    var constr = resultObj.constructor;
                    // If the constructor exists and is not the same as the
                    // previously called one, call it.
                    if(constr && constr != prevConstructor)
                    {
                        constr.apply(resultObj,classArgs);
                        prevConstructor = constr;
                    }

                    // Set destr to the destructor for quick access
                    var destr = resultObj.destructor;
                    // Save the destructor if it exists and is not the
                    // same as the previous one.
                    if(destr && destr != prevDestructor)
                    {
                        prevDestructor = destr;
                        jClassMeta.destructors.push(destr);
                    }
                });

                // Extend our class instance object
                resultObj.jClass = jQuery.extend({ _meta: jClassMeta }, classInstanceMethods, classSharedMethods);
                resultObj.destroy = destructor;
            };

            // Extend our class object
            jQuery.extend(resultClass,{
                objs: objs,
                jClass: jQuery.extend({_meta: { obj: resultClass}},classBaseMethods, classSharedMethods)
            });
            return resultClass;
        }
    });
})();
