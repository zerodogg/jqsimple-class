/*
 * This is a very simple test for the CommonJS version of jqsimple-class.
 * It's primarily a sanity check that it loads ok.
 */
console.log('jQsimple-class CommonJS tests');

var path = require('path'),
    fs   = require('fs');

function exists (path)
{
    try
    {
        fs.statSync(path);
    }
    catch(e)
    {
        return false;
    }
    return true;
}
require.paths.unshift(__dirname+'/../');

if (!exists(__dirname+'/../jqsimple-class.commonjs.js'))
{
    console.log('You do not seem to have built the commonjs version of jqsimple-class');
    console.log('Run "make commonjs" from the base directory of the jqsimple-class tree');
    console.log('to build it. And then run the tests again.');
    process.exit(0);
}

var jClass = global.jClass = require('jqsimple-class.commonjs').jClass;

var myClass = jClass({});
var inst = new myClass();

console.log('Preliminary sanity check worked. Moving on to unit tests.');

if (! exists(__dirname+'/node-qunit/lib/testrunner.js'))
{
    console.log('\n'+__dirname+'/node-qunit/lib/testrunner.js'+': does not exist');
    console.log('Can\'t run unit tests. To rectify this, clon the node-qunit git repository:');
    console.log('  git clone http://github.com/kof/node-qunit.git '+__dirname+'/node-qunit');
    console.log('Exiting prematurely');
    process.exit(1);
}

var testrunner = require(__dirname+'/node-qunit/lib/testrunner');
testrunner.run({
    code: __dirname+'/../jqsimple-class.commonjs.js',
    test: __dirname+'/tests.js'
});
