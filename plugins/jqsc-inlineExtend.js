/*! inlineExtend plugin for jQsimple-Class
 * Licensed under the same terms as jQsimple-Class itself */
(function() {
    /* Boilerplate that fetches the jClass object both in a browser and in
     * nodejs */
    var jClassO; try { jClassO = jClass; } catch(err) { jClassO = global.jClass };

    /*
     * Method for extending existing classes with new methods
     */
    jClassO.cMethods.inlineExtend = function(append)
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
        append = jClass._$.extend({},append);
        // Remove constructor and destructor if present
        append._destructor = append._constructor = null;
        // Finally, add it to the inheritance list
        this._meta.obj.objs.unshift(append);
        return this;
    }
})();
