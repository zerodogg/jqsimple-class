MINIFY_JAR_PATH=$(shell echo ~)/.local/yuiminify/yuicompressor.jar
MINIFY=java -jar $(MINIFY_JAR_PATH)
MINIFY_OUT=jqsimple-class.min.js
MINIFY_IN=jqsimple-class.js
minify: minifyPrep
	$(MINIFY) $(MINIFY_JS_OPTS) $(MINIFY_IN) -o $(MINIFY_OUT)
	# jQuery references
	perl -pi -e 's/\$$extend/\$$e/g; s/\$$merge/\$$m/g; s/\$$isArray/\$$i/g; s/\$$each/\$$c/g;' $(MINIFY_OUT)
	# Variables that YUI minifier doesn't minify, or is part of our objects
	perl -pi -e 's/_meta/_m/g; s/virtual:t/v:t/g; s/\.virtual/\.v/g; s/objs:/o:/g; s/\.objs/\.o/g; s/classSharedMethods/CS/g; s/classBaseMethods/CB/g; s/destructors/_d/g; s/resolveInheritance/RI/g; s/identifier/i/g; s/extendClass/EC/g; s/,destructor=/,DS=/g; s/=destructor/=DS/g; s/obj/O/g; s/removeConstructAndDestruct/_R/g; s{/\*}{/\*!}g;' $(MINIFY_OUT)
clean:
	rm -f *.min.js
	rm -f *~

standalone: STANDALONE_OUT=jqsimple-class.standalone.js
standalone:
	[ -e jquery.copyright.js ] || wget -Ojquery.copyright.js http://code.jquery.com/jquery-1.4.2.min.js
	[ -e jquery.core.js ] || wget -Ojquery.core.js http://github.com/jquery/jquery/raw/1.4.2/src/core.js
	perl -ni -e 'if(/\(function.*/) { $$seen = 1 }; next if $$seen; print;' jquery.copyright.js
	echo '(function () {' >  $(STANDALONE_OUT)
	cat jquery.copyright.js >> $(STANDALONE_OUT)
	cat jquery.core.js >> $(STANDALONE_OUT)
	cat jqsimple-class.js >> $(STANDALONE_OUT)
	perl -pi -e 's/\(jQuery\)/\(jQuery.noConflict(true)\)/' $(STANDALONE_OUT)
	echo "})()" >> $(STANDALONE_OUT)
	make MINIFY_IN="$(STANDALONE_OUT)" MINIFY_OUT="jqsimple-class.standalone.min.js" minify

# Helpers for minifying JS
MINIFY_VERSION=2.4.2
WGET=wget -c --random-wait --retry-connrefused -t 20

minify_verbose: MINIFY_JS_OPTS += -v
minify_verbose: minify
minifyPrep:
	if [ ! -e "$(MINIFY_JAR_PATH)" ]; then echo "You don't have the YUI compressor. Run \"make compressor_download\"";echo "to download and extract it to ~/.local/yuiminify/";exit 1;fi
	if ! type java >/dev/null; then echo "Needs java to run"; exit 1;fi
compressor_download:
	@echo ""
	@echo " * * *"
	@echo "Downloading/upgrading yuicompressor." || true
	@echo " * * *"
	@echo ""
	@if ! type unzip; then echo "Needs unzip";exit1;fi
	@if ! type wget; then echo "Needs wget";exit1;fi
	mkdir -p ~/.local/yuiminify/
	cd ~/.local/yuiminify; $(WGET) "http://www.julienlecomte.net/yuicompressor/yuicompressor-$(MINIFY_VERSION).zip" 
	cd ~/.local/yuiminify; unzip -q "yuicompressor-$(MINIFY_VERSION).zip"
	cd ~/.local/yuiminify; mv -f "yuicompressor-$(MINIFY_VERSION)/build/yuicompressor-$(MINIFY_VERSION).jar" yuicompressor.jar
	cd ~/.local/yuiminify; rm -rf ./yuicompressor-$(MINIFY_VERSION)*
