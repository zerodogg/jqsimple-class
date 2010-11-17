/*
 * The classes here are rather useless, but serve as a decent example
 * of a working jQsimple-class-based class
 */

var menu_typeof = jClass.virtual({
	is_text_var: function(v,error)
	{
		if(v == null)
			throw(error);
		if (!(typeof(v).match(/(number|string)/)))
			throw(error);
	}
});

var menuEntry = jClass({
	name: null,
	url: null,

	_constructor: function(name,url)
	{
		this.is_text_var(name,'name must be a number or a string');
		this.is_text_var(url,'url must be a number or a string');
		this.name = name;
		this.url = url;
	}
});

/* We could also have used jClass.extend(menu_typeof, { ..
 * for the same effect here, but using inlineExtend when extending
 * virtual classes is usually more useful, because it leaves the
 * primary .extend() free for other, more specific classes.
 */
menuEntry.jClass.inlineExtend(menu_typeof);

var menu = jClass({
	entries: [],
	target: null,
	autoDraw: false,

	_constructor: function(target)
	{
		// Validate the parameter
		if(typeof(target) != 'string')
			throw('Invalid target for menu');
		if($(target).length == 0)
			throw('Failed to find '+target);
		this.target = target;
	},

	_destructor: function ()
	{
		// Clear target on destruction
		if(this.target)
			$(this.target).html('');
	},

	addEntry: function(name,url)
	{
		var entry = new menuEntry(name,url);
		this.entries.push(entry);
		if(this.autoDraw)
			this.draw();
	},

	draw: function ()
	{
		var html = '';
		$.each(this.entries, function (i,entry)
			   {
				   if(html != '')
					   html = html+' | ';
				   html = html+'<a href="'+entry.url+'">'+entry.name+'</a>';
			   });
		$(this.target).html(html);
	}
});

/*
 * This class overrides the addEntry method in the menu class and removes use of
 * the menuEntry class
 */
var menuBuiltin = jClass.extend([menu,menu_typeof],{
	addEntry: function (name,url)
	{
		this.is_text_var(name,'You must supply a name, and it has to be an alphanumerical string');
		this.is_text_var(url,'You must supply a url.');
		this.entries.push({ url:url, name: name});
		if(this.autoDraw)
			this.draw();
	}
});
