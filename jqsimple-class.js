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
    var objs = new Array();
    objs.push(obj);
    return jClass._buildConstructor(objs);
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
            append.constructor = undefined;
            this.obj.objs.unshift(append);
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
        version: version,
        classObj: jClass
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

		// Method for extending an existing class without inheriting constructors
        extendS: function (orig,extension)
        {
            var objs = orig.objs;
            jQuery.each(objs, function (i,o) {
                o.constructor = undefined;
            });
            objs.push(extension);
            return jClass._buildConstructor(objs);
        },


		// Method used to build a constructor function for classes, setting up inheritance
		// and calling constructors defined in the class.
        _buildConstructor: function(objs)
        {
            var resultClass = function ()
            {
                var resultObj = this;
                var classArgs = arguments;
                var prevConstructor = null;
                // Extend a dummy object to ensure that constructor is not ourselves
                jQuery.extend(resultObj, { constructor: function () {} });
                
                // Extend all parents and call their constructors
                jQuery.each(objs, function (i,o) {
                    jQuery.extend(resultObj,o);
                    var constr = resultObj.constructor;
                    if(constr != undefined && constr != null && constr != prevConstructor)
                    {
                        constr.apply(resultObj,classArgs);
                        prevConstructor = constr;
                    }
                });

                // Extend our class instance object
                resultObj.jClass = jQuery.extend({ obj: resultObj}, classInstanceMethods, classSharedMethods);
            };

            // Extend our class object
            jQuery.extend(resultClass,{
                objs: objs,
                jClass: jQuery.extend({obj: resultClass},classBaseMethods, classSharedMethods)
            });
            return resultClass;
        }
    });
})();
