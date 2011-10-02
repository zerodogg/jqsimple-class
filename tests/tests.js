/* vim: set expandtab : */

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

jQuery(function($)
{
  // This is a basic class used throughout the tests
  var basicClass = {
      instVal: null,
      constructorRun: false,

      _constructor: function (val)
      {
          this.instVal = val;
          this.constructorRun = true;
      },
      _destructor: function ()
      {
      },
      setValue: function (myval)
      {
          this.instVal = myval;
      },
      test: function ()
      {
          return true;
      }
  };

  test("Basic sanity", function ()
  {
      expect(3);

      ok(jClass !== undefined,'jClass needs to exist');
      ok(typeof(jClass) == 'function', 'jClass needs to exist and be a function');
      var myClass = jClass({});
      ok(typeof(myClass) == 'function', 'Expects function');
  });

  test("A usable basic class", function ()
  {
      expect(8);

      var myClass = jClass(basicClass);

      var inst = new myClass(1);
      ok(inst,'Instance needs to exist');
      equals(inst.test(),true,'Instance method return value');
      equals(inst.instVal,1,'Instance value as supplied to constructor');
      inst.setValue(2);
      equals(inst.instVal,2,'Instance value as supplied to setValue');

      var inst2 = new myClass(9);
      ok(inst2,'Second instance needs to exist');
      equals(inst.instVal,2,'Instance value for inst should not have changed');
      equals(inst2.instVal,9,'Instance value for inst2 should be as supplied to the constructor');

      ok(myClass.test === undefined,'Class itself should not inherit class methods');
  });

  test("Extending a class", function ()
  {
      expect(6);

      var base = jClass(basicClass);
      var extended = jClass.extend(base, {
          baseConstructorRanFirst: false,

          _constructor: function ()
          {
              this.instVal = true;
              if(this.constructorRun)
                  this.baseConstructorRanFirst = true;
          }
      });


      var inst = new extended(1);
      ok(inst,'Instance needs to exist');
      ok(inst.jClass !== undefined,'.jClass on instance exists');
      ok(inst.jClass.version,'Version attrib exists');
      ok(inst.baseConstructorRanFirst, 'The base constructor should run first');
      equals(true,inst.instVal,'Instance value should not be as supplied to constructor');

      var extended2 = jClass.extendS(base, {});
      inst = new extended2(1);
      equals(null,inst.instVal,'Instance value should not be set at all');
  });

  test("Extend with array created with 'new Array'", function ()
  {
      var base = jClass(basicClass);
      var extendList = new Array(base);

      var extended = jClass.extend(extendList, {} );

      var inst = new extended(1);

      ok(inst, 'Instance needs to exist');
  });

  test("Object instance copy", function ()
  {
      expect(2);
      var object = {
          meth1: function () { return true },
          attr1: true
      };

      var cl = jClass(object);
      object.attr1 = false;
      object.meth1 = function () { return false };

      var instance = new cl();
      equals(true,instance.attr1);
      equals(true,instance.meth1());
  });

  test("Instantiation without 'new'", function ()
  {
      expect(1);
      var myClass = jClass(basicClass);
      var success = true;
      try
      {
          var instance = myClass();
          success = false;
      } catch(e) {}
      ok(success,'Instantiation should fail');
  });

  test("Diamond inheritance pattern", function ()
  {
      expect(15);

      var D = jClass({
          top: 'D',
          constructors: 0,
          constructorOrder: [],
          _constructor: function ()
          {
              this.constructors++;
              this.constructorOrder.unshift('D');
          }
      });
      var B = jClass.extend(D,
      {
          top: 'B',
          constructors: 0,
          constructorOrder: [],
          _constructor: function ()
          {
              this.constructors++;
              this.constructorOrder.unshift('B');
          }
      }
      );
      var C = jClass.extend(D,
      {
          top: 'C',
          constructors: 0,
          constructorOrder: [],
          _constructor: function ()
          {
              this.constructors++;
              this.constructorOrder.unshift('C');
          }
      }
      );
      var A = jClass.extend([B,C],
      {
          top: 'A',
          constructors: 0,
          constructorOrder: [],
          _constructor: function ()
          {
              this.constructors++;
              this.constructorOrder.unshift('A');
          }
      }
      );

      var inst;

      inst = new D();
      equals(inst.constructors,1,'D should run a single constructor');
      equals(inst.top,'D','D should be its own toplevel class');
      same(inst.constructorOrder,['D'],'D does not inherit');

      inst = new B();
      equals(inst.constructors,2,'B should run two constructors');
      same(inst.constructorOrder,['B','D'],'B should inherit D');
      equals(inst.top,'B','B should be its own toplevel class');

      inst = new C();
      equals(inst.constructors,2,'C should run two constructors');
      same(inst.constructorOrder,['C','D'],'C should inherit D');
      equals(inst.top,'C','C should be its own toplevel class');

      inst = new A();

      equals(inst.constructors,4,'A should run four constructors');
      same(inst.constructorOrder,['A','B','C','D'],'Inheritance for A should be resolved to ABCD');
      equals(inst.top,'A','A should be its own toplevel class');

      /*
       * This is here to test more basic three-level inheritance,
       * as if that fails, the above diamond pattern will as well.
       */

      var X = jClass.extend(B,
      {
          top: 'X',
          constructors: 0,
          constructorOrder: [],
          _constructor: function ()
          {
              this.constructors++;
              this.constructorOrder.unshift('X');
          }
      });

      inst = new X();
      equals(inst.constructors,3,'X should have run three constructors');
      same(inst.constructorOrder,['X','B','D'],'Inheritance for X should be resolved to XBD');
      equals(inst.top,'X','X should be its own toplevel class');
  });

  (function()
  {
      var base = jClass({
          constructCalls: 0,
          baseDone: 0,
          baseFirst: true,
          overriddenMethod: function ()
          {
              return false;
          },
          finalOverride: function ()
          {
              return false;
          },
          _constructor: function ()
          {
              this.constructCalls++;
              this.baseDone++;
          }
      });

      var main = {
          mainConstructors: 0,
          me: null,
          overriddenMethod: function ()
          {
              return true;
          },
          finalOverride: function ()
          {
              return true;
          },
          _constructor: function ()
          {
              this.constructCalls++;
              this.mainConstructors++;
              if(this.baseDone == 0)
                this.baseFirst = false;
          }
      };
      var myMain = $.extend({},main);
      myMain.finalOverride = function ()
      {
          return 1;
      };
      var cl1 = jClass.extend(base,main);
      var cl2 = jClass.extend(base,main);
      var cl3 = jClass.extend(base,main);
      var cl4 = jClass.extend(base,main);

      test("Multi-layer inheritance and constructor call ordering", function ()
      {
          expect(6);

          var final = jClass.extend([cl1,cl2,cl3,cl4],myMain);

          var inst = new final();

          equals(inst.baseFirst,true,'Base constructor must have been called first');
          equals(inst.baseDone,1,'Base constructor must only have been called once');
          equals(inst.mainConstructors,5,'5 constructors from "main" classes (cl*) should have been called');
          equals(inst.constructCalls,6,"6 constructors should have been called");
          equals(inst.overriddenMethod(),true,'Main class should override method from parent class');
          equals(inst.finalOverride(),1,'Top class should override all methods from parents');

      });
      test("Complex multi-layer inheritance and constructor call ordering",function ()
      {
          expect(6);

          var complex = jClass.extend([cl1,cl2,cl3,cl1,cl4,cl3,cl2],myMain);
          inst = new complex();
          equals(inst.baseFirst,true,'Base constructor must have been called first');
          equals(inst.baseDone,1,'Base constructor must only have been called once');
          equals(inst.mainConstructors,5,'5 constructors from "main" classes (cl*) should have been called');
          equals(inst.constructCalls,6,"6 constructors should have been called");
          equals(inst.overriddenMethod(),true,'Main class should override method from parent class');
          equals(inst.finalOverride(),1,'Top class should override all methods from parents');
      });
  })();

  test("Virtual classes", function ()
  {
      expect(10);

      var virtual = jClass.virtual({
          constrCall: false,
          constRun: 0,
          _constructor: function ()
          {
              this.constrCall = true;
              this.constRun++;
          },
          test: function () { return true; },
          didVirtual: true
      });

      var inst;
      try
      {
          inst = new virtual();
      } catch(e) {}
      ok(inst == undefined,'Must not be able to instantiate');

      var full = jClass.extend(virtual,{});
      inst = new full();

      equals(inst.constrCall,true,'Virtual class constructor should have been called');
      equals(inst.constRun,1,'Constructor should have been run exactly once');
      equals(inst.test(),true,'After extending the test method should be inherited properly');

      var full2 = jClass.extend(virtual, {
          test: function () { return false; }
      });
      inst = new full2();

      equals(false, inst.test(),'Parent should override virtual method');
      equals(true, inst.didVirtual, 'But other bits should still be inherited properly');

      var multi;
      try
      {
          multi = jClass.extend([virtual,jClass(basicClass)],{});
      } catch(e) {}
      ok(multi,'multi-class extend succeeded');
      try
      {
          inst = new multi();
      } catch(e){}
      ok(inst,'multi-class instantiated');
      equals(inst.constrCall,true,'Virtual class constructor should have been called');
      equals(inst.constructorRun,true,'basicClass class constructor should have been called');

  });

  test("Destructors", function ()
  {
      expect(4);

      var destructorRun = false;

      var myClass = jClass({
          _destructor: function ()
          {
              destructorRun = true;
          }
      });

      var inst = new myClass();
      inst.destroy();
      ok(destructorRun,'Destructor should have been run');
      var methods = 0;
      $.each(inst, function ()
      {
          methods++;
      });
      equals(methods,0,'Object should have been fully destroyed');

      destructorRun = false;
      var destructorRun2 = false;

      var myClass2 = jClass.extend(myClass, {
          _destructor: function()
          {
              destructorRun2 = true;
              
          }
      });
      var inst2 = new myClass2();
      inst2.destroy();
      ok(destructorRun, 'First destructor should have been run');
      ok(destructorRun2, 'Second destructor should have been run');
  });

  test("Constructor inheritance", function()
  {
      expect(6);

      var destructors = 0;

      var base = jClass({
          constRun: 0,
          _constructor: function()
          {
              this.constRun++;
          },
          _destructor: function()
          {
              destructors++;
          }
      });

      var child = jClass.extend(base,{});
      var child2 = jClass.extend(child,{
          _destructor: function()
          {
              destructors++;
          }
      });

      var instance = new child();
      ok(instance,'Should have been instantiated');
      equals(instance.constRun,1,'Constructor should only have been run once');
      instance.destroy();
      equals(destructors,1,'One destructor should have been run');

      // Reset destructors
      destructors = 0;

      var instance2 = new child2();
      ok(instance2,'Should have been instantiated');
      equals(instance2.constRun,1,'Constructor should only have been run once');
      instance2.destroy();
      equals(destructors,2,'Two destructors should have been run');
  });

  test("Class attempting to use .jClass namespace", function ()
  {
      expect(2);

      var myClass = jClass({
          jClass: {
              version: 200,
              hasNamespace: true
          }});
      var reference = jClass();
      var refInst = new reference();
      var inst = new myClass();
      equals(inst.jClass.version,refInst.jClass.version,'Class should not be able to override .version');
      equals(inst.jClass.hasNamespace,undefined,'Class should not be able to add stuff to .jClass');
  });

  test("Attempt to extend non-jClass object", function ()
  {
      expect(1);

      var didFail = false;
      try
      {
          var extended = jClass.extend({}, {
              meth: function () { return true; }
          });
      }
      catch(e)
      {
          didFail = true;
      }
      ok(didFail,"Should not succeed");
  });

  test("Examples from POD", function ()
  {
      expect(20);
      /*
       * This test runs through much of the example code listed in the POD
       */
     var destroyed = false;
     var inst;
     var existing = jClass({
       inited: false,
       _constructor: function() { this.inited = true; },
       _destructor: function () {destroyed = true},
       method1: function () { return 1; },
       method2: function () { return 2; }
     });

     inst = new existing();
     ok(inst != null, 'Instantiation should succeed');
     ok( (inst.method1() == 1) && (inst.method2() == 2),'Methods should work');
     ok(inst.inited, 'Constructor should have been run');
     inst.destroy();
     ok(destroyed, 'Destructor should have been run');
     destroyed = false;

     var ex1 = jClass.extend(existing, {
       inited2: false,
       _constructor: function () { this.inited2 = true; },
       method1: function () { return 3; },
       method2: function () { return 4; }
     });

     inst = new ex1();
     ok(inst != null, 'Instantiation should succeed');
     equals(inst.method1(),3,'method1 should have been overridden');
     equals(inst.method2(),4,'method2 should have been overridden');
     ok(inst.inited, 'Constructor should have been run');
     ok(inst.inited2, 'Lower constructor should have been run');
     inst.destroy();
     ok(destroyed, 'Destructor should have been run');
     destroyed = false;

     var ex2 = jClass.extendS(existing, {
       inited2: false,
       _constructor: function () { this.inited2 = true },
       method1: function () { return 5; },
       method2: function () { return 6; }
     });

     inst = new ex2();
     ok(inst != null, 'Instantiation should succeed');
     equals(inst.method1(),5,'method1 should have been overridden');
     equals(inst.method2(),6,'method2 should have been overridden');
     ok(!inst.inited, 'Top constructor should not have been run');
     ok(inst.inited2, 'Lower constructor should have been run');
     inst.destroy();
     ok(!destroyed, 'Destructor should not have been run');


    var myClass = jClass({
                    logged: null,
                    _constructor: function ()
                    {
                        this.log('Yay');
                    },

                    log: function(msg)
                    {
                        this.logged = msg;
                    }
                });
    
    var myInstance = new myClass();
    equals(myInstance.logged,'Yay','Yay should be "logged"');
    myInstance.log('Hooray');
    equals(myInstance.logged,'Hooray','Hooray should be "logged"');

    var mySilentClass = jClass.extendS(myClass, {});
    var mySilentInstance = new mySilentClass();
    equals(mySilentInstance.logged,null,'Should not have "logged" anything');

    var myUtils = jClass.virtual({
        utilMeth: function () { }
    });
    var myUI = jClass.virtual({
        showMessage: function () { }
    });
    var myFinalClass = jClass.extend([myUtils,myUI],{
        _constructor: function ()
        {
            this.showMessage(this.utilMeth('Hi'));
        }});
    var myFinalInstance = new myFinalClass();
    ok(myFinalInstance.showMessage && myFinalInstance.utilMeth, 'Methods should exist');
  });
});
