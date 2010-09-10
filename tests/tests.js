/* vim: set expandtab : */
$(function()
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
      expect(7);

      var myClass = jClass(basicClass);

      var inst = new myClass(1);
      ok(inst,'Instance needs to exist');
      equals(true,inst.test(),'Instance method return value');
      equals(1,inst.instVal,'Instance value as supplied to constructor');
      inst.setValue(2);
      equals(2,inst.instVal,'Instance value as supplied to setValue');

      var inst2 = new myClass(9);
      ok(inst2,'Second isntance needs to exist');
      equals(2,inst.instVal,'Instance value for inst should not have changed');
      equals(9,inst2.instVal,'Instance value for inst2 should be as supplied to the constructor');
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

  test("Inline extending a class", function ()
  {
      expect(4);

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

      ok(preInst.test == undefined,'Pre-extension instance should not have inlinExtend-ed method');
      equals(inst.test(),true,'Post-extension instance should have inlineExtend-ed method');
      equals(inst.existing(),1,'inlineExtend should not override existing method');
      equals(inst2.constrCalled,false,'inlineExtend should not add constructor');
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
      expect(5);

      var virtual = jClass.virtual({
          constrCall: false,
          _constructor: function ()
          {
              this.constrCall = true;
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

      equals(inst.constrCall,false,'Virtual class constructor should not have been called');
      equals(inst.test(),true,'After extending the test method should be inherited properly');

      var full2 = jClass.extend(virtual, {
          test: function () { return false; }
      });
      inst = new full2();

      equals(false, inst.test(),'Parent should override virtual method');
      equals(true, inst.didVirtual, 'But other bits should still be inherited properly');
  });

  test("Destructors", function ()
  {
      expect(2);

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
      console.log(inst);
      var methods = 0;
      $.each(inst, function ()
      {
          methods++;
      });
      equals(methods,0,'Object should have been fully destroyed');
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
});
