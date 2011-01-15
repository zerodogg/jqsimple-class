/*
 * Declares a mock jQuery object for use when running under node
 */
if(jQuery === undefined)
{
    var jQuery = global.jQuery = function (func)
    {
        func(jQuery);
    };
    jQuery.extend = function (target,source)
    {
        for (var s in source)
        {
            if (typeof source[s] == 'object')
            {
                target[s] = {};
                jQuery.extend(target[s], source[s]);
            }
            else
            {
                target[s] = source[s];
            }
        }
        return target;
    };
    jQuery.each = function (what, callback)
    {
        for (var n in what)
        {
            callback(n,what[n]);
        }
    };
}

/*
 * Loads the plugins for use when running under node
 */
try
{
    if(process.versions.node !== undefined)
    {
        require.paths.unshift(__dirname+'/../plugins/');
        require('jqsc-inlineExtend');
    }
} catch(e) { console.log(e); };

jQuery(function($)
{
    /************************
     * jqsc-inlineExtend.js *
     ************************/
  test("jqSc-inlineExtend.js: Inline extending a class", function ()
  {
      expect(5);

      var base = jClass({
          existing: function () { return 1; }
      });

      var preInst = new base();

      base.jClass.inlineExtend({
          test: function () { return true; },
          existing: function () { return 2; }
      });

      var inst = new base();

      base.jClass.inlineExtend({
          constrCalled: false,

          _constructor: function ()
          {
              this.constrCalled = true;
          }
      });

      var inst2 = new base();

      base.jClass.inlineExtend({
          firstInline: true
      }).inlineExtend({
          secondInline: true
      });

      var inst3 = new base();

      ok(preInst.test == undefined,'Pre-extension instance should not have inlinExtend-ed method');
      equals(inst.test(),true,'Post-extension instance should have inlineExtend-ed method');
      equals(inst.existing(),1,'inlineExtend should not override existing method');
      equals(inst2.constrCalled,false,'inlineExtend should not add constructor');

      ok( (inst3.firstInline === true) && (inst3.secondInline === true), 'Chained inlineExtend should work');
  });
});
