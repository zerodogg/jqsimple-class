MINIFY_JAR_PATH=$(shell echo ~)/.local/yuiminify/yuicompressor.jar
MINIFY=java -jar $(MINIFY_JAR_PATH)
minify: minifyPrep
	$(MINIFY) $(MINIFY_JS_OPTS) "jqsimple-class.js" -o "jqsimple-class.min.js"
	# Private methods/variables can be minified further.
	perl -pi -e 's/_buildConstructor/_B/g; s/destructors/_d/g; s/_meta/_m/g; s/_strictArray/_s/g; s/_resolveInheritance/_R/g; s/virtual:t/v:t/g; s/\.virtual/\.v/g; s/objs:/o:/g; s/\.objs/\.o/g; s/objs/_o/g; s/_extendClass/_e/g; s/obj/O/g; s{/\*}{/\*!}g;' jqsimple-class.min.js
clean:
	rm -f *.min.js
	rm -f *~

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
