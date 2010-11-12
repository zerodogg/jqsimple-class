MINIFY_JAR_PATH=$(shell echo ~)/.local/closure-compiler/closure-compiler.jar
MINIFY=java -jar $(MINIFY_JAR_PATH)
MINIFY_JS_OPTS?=
MINIFY_OUT=jqsimple-class.min.js
MINIFY_IN=jqsimple-class.js
VERSION=$(shell grep version: jqsimple-class.js |perl -pi -e "s/.*version:\D*//; s/\D+$$//; s/\s*//g;")#"

all: minify standalone commonjs

minify: minifyPrep minify_base minify_additional
minify_base: minifyPrep
	head -n2 jqsimple-class.js > "$(MINIFY_OUT)"
	$(MINIFY) $(MINIFY_JS_OPTS) --js="$(MINIFY_IN)" --js_output_file=".minify-tmp.js"
	perl -pi -e 'chomp;' .minify-tmp.js
	cat .minify-tmp.js >> "$(MINIFY_OUT)"; rm -f .minify-tmp.js
minify_additional:
	# jQuery references
	perl -pi -e 's/\$$extend/\$$e/g; s/\$$merge/\$$m/g; s/\$$isArray/\$$i/g; s/\$$each/\$$c/g;' $(MINIFY_OUT)
	# Variables that the minifier doesn't minify, or is part of our objects
	perl -pi -e 's/_meta/_m/g; s/virtual:t/v:t/g; s/\.virtual/\.v/g; s/objs:/o:/g; s/\.objs/\.o/g; s/classSharedMethods/CS/g; s/classBaseMethods/CB/g; s/destructors/_d/g; s/resolveInheritance/RI/g; s/identifier/i/g; s/extendClass/EC/g; s/,destructor=/,DS=/g; s/=destructor/=DS/g; s/obj/O/g; s/removeConstructAndDestruct/_R/g; s{/\*}{/\*!}g;' $(MINIFY_OUT)
clean:
	rm -f *.min.js
	rm -f *~
	rm -rf ./jqsimple-class-$(VERSION)

distrib:
distrib: clean  minify standalone commonjs
	mkdir -p jqsimple-class-$(VERSION)
	rename "s/\.min/-$(VERSION)\.min/" *.min.js
	cp jqsimple-class.js jqsimple-class-$(VERSION).js
	mv jqsimple-class.standalone.js jqsimple-class.standalone-$(VERSION).js
	mv jqsimple-class.commonjs.js jqsimple-class.commonjs-$(VERSION).js
	mv *"$(VERSION)"*.js jqsimple-class-$(VERSION)/

STANDALONE_OUT?=jqsimple-class.standalone.js
STANDALONE_OUT_MINIFIED?=jqsimple-class.standalone.min.js
STANDALONE_SRC?=jqsimple-class.js
standalone: standalone_build standalone_minify
standalone_build:
	perl -ni -e 'if(/\(function.*/) { $$seen = 1 }; next if $$seen; print;' jquery.copyright.js
	echo '(function () {' >  $(STANDALONE_OUT)
	cat includes/stripped-jquery-core.js >> $(STANDALONE_OUT)
	cat $(STANDALONE_SRC) >> $(STANDALONE_OUT)
	perl -pi -e 's/\(jQuery\)/\(JQSHelpers\)/' $(STANDALONE_OUT)
	echo "})()" >> $(STANDALONE_OUT)

standalone_minify: minify
	make standalone_build STANDALONE_SRC="$(MINIFY_OUT)" STANDALONE_OUT="$(STANDALONE_OUT_MINIFIED)"
	mv -f "$(STANDALONE_OUT_MINIFIED)" "$(STANDALONE_OUT_MINIFIED).pre.js"
	make MINIFY_IN="$(STANDALONE_OUT_MINIFIED).pre.js" MINIFY_OUT="$(STANDALONE_OUT_MINIFIED)" minify_base
	rm -f "$(STANDALONE_OUT_MINIFIED).pre.js"
	perl -pi -e 's/isFunction/J_IF/g; s/isArray/J_IA/g; s/isPlainObject/J_IP/g; s/makeArray/J_MA/g;' "$(STANDALONE_OUT_MINIFIED)"

commonjs: standalone_build
	cp jqsimple-class.standalone.js jqsimple-class.commonjs.js
	perl -pi -e 's/window\.jClass/exports\.jClass/g' jqsimple-class.commonjs.js

test: commonjs
	[ -e "./tests/node-qunit" ] || git submodule update
	if type nodejs >/dev/null; then NODE="nodejs"; else NODE="node";fi; \
		echo ""; \
		$$NODE tests/commonjs-node.js
	@echo ""
	@echo "Open ./tests/tests.html and/or ./tests/tests-standalone.html in a browser"
	@echo "to run the tests there."

# Helpers for minifying JS
WGET=wget -c --random-wait --retry-connrefused -t 20

minifyPrep:
	if [ ! -e "$(MINIFY_JAR_PATH)" ]; then echo "You don't have the Closure Compiler. Run \"make compressor_download\"";echo "to download and extract it to ~/.local/closure-compiler/";exit 1;fi
	if ! type java >/dev/null; then echo "Needs java to run"; exit 1;fi
compressor_download:
	@echo ""
	@echo " * * *"
	@echo "Downloading/upgrading Closure Compiler." || true
	@echo " * * *"
	@echo ""
	@if ! type unzip; then echo "Needs unzip";exit1;fi
	@if ! type wget; then echo "Needs wget";exit1;fi
	mkdir -p ~/.local/closure-compiler/
	cd ~/.local/closure-compiler; $(WGET) http://closure-compiler.googlecode.com/files/compiler-latest.zip
	cd ~/.local/closure-compiler; unzip -q "compiler-latest.zip"
	cd ~/.local/closure-compiler; mv compiler.jar closure-compiler.jar
