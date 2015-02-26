/*
 * post-menu.js - adds dropdown menu to posts
 *
 * Creates a global Menu object with four public methods:
 *
 *   Menu.onclick(fnc)
 *     registers a function to be executed after button click, before the menu is displayed
 *   Menu.add_item(id, text[, title])
 *     adds an item to the top level of menu
 *   Menu.add_submenu(id, text)
 *     creates and returns a List object through which to manipulate the content of the submenu
 *   Menu.get_submenu(id)
 *     returns the submenu with the specified id from the top level menu
 *
 *   The List object contains all the methods from Menu except onclick()
 *
 *   Example usage:
 *     Menu.add_item('filter-menu-hide', 'Hide post');
 *     Menu.add_item('filter-menu-unhide', 'Unhide post');
 *
 *     submenu = Menu.add_submenu('filter-menu-add', 'Add filter');
 *         submenu.add_item('filter-add-post-plus', 'Post +', 'Hide post and all replies');
 *         submenu.add_item('filter-add-id', 'ID');
 *  
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/post-menu.js';
 */
(function () {

var List = function (menuId, text) {
	this.id = menuId;
	this.text = text;
	this.items = [];

	this.add_item = function (itemId, text, title) {
		this.items.push(new Item(itemId, text, title));
	};
	this.list_items = function () {
		var array = [];
		var i, length, obj, $ele;

		if ($.isEmptyObject(this.items))
			return;

		length = this.items.length;
		for (i = 0; i < length; i++) {
			obj = this.items[i];

			$ele = $('<li>', {id: obj.id}).text(obj.text);
			if ('title' in obj) $ele.attr('title', obj.title);

			if (obj instanceof Item) {
				$ele.addClass('post-item');
			} else {
				$ele.addClass('post-submenu');

				$ele.prepend(obj.list_items());
				$ele.append($('<span>', {class: 'post-menu-arrow'}).text('»'));
			}

			array.push($ele);
		}

		return $('<ul>').append(array);
	};
	this.add_submenu = function (menuId, text) {
		var ele = new List(menuId, text);
		this.items.push(ele);
		return ele;
	};
	this.get_submenu = function (menuId) {
		for (var i = 0; i < this.items.length; i++) {
			if ((this.items[i] instanceof Item) || this.items[i].id != menuId) continue;
			return this.items[i];
		}
	};
};

var Item = function (itemId, text, title) {
	this.id = itemId;
	this.text = text;

	// optional
	if (typeof title != 'undefined') this.title = title;
};

function buildMenu(e) {
	var pos = $(e.target).offset();
	var i, length;

	var $menu = $('<div class="post-menu"></div>').append(mainMenu.list_items());

	//  execute registered click handlers
	length = onclick_callbacks.length;
	for (i = 0; i < length; i++) {
		onclick_callbacks[i](e, $menu);
	}

	//  set menu position and append to page
	 $menu.css({top: pos.top, left: pos.left + 20});
	 $('body').append($menu);
}

function addButton(post) {
	var $ele = $(post);
	$ele.find('input.delete').after(
		$('<a>', {href: '#', class: 'post-btn', title: 'Post menu'}).text('▶')
	);
}


/* * * * * * * * * *
    Public methods
 * * * * * * * * * */
var Menu = {};
var mainMenu = new List();
var onclick_callbacks = [];

Menu.onclick = function (fnc) {
	onclick_callbacks.push(fnc);
};

Menu.add_item = function (itemId, text, title) {
	mainMenu.add_item(itemId, text, title);
};

Menu.add_submenu = function (menuId, text) {
	return mainMenu.add_submenu(menuId, text);
};

Menu.get_submenu = function (id) {
	return mainMenu.get_submenu(id);
};


/* * * * * * * *
    Initialize
 * * * * * * * */

/*  Styling
 */
var $ele, cssStyle, cssString;

$ele = $('<div>').addClass('post reply').hide().appendTo('body');
cssStyle = $ele.css(['border-top-color']);
cssStyle.hoverBg = $('body').css('background-color');
$ele.remove();

cssString =
	'\n/*** Generated by post-menu ***/\n' +
	'.post-menu {position: absolute; font-size: 12px; line-height: 1.3em;}\n' +
	'.post-menu ul {\n' +
	'    background-color: '+ cssStyle['border-top-color'] +'; border: 1px solid #666;\n' +
	'    list-style: none; padding: 0; margin: 0; white-space: nowrap;\n}\n' +
	'.post-menu .post-submenu{white-space: normal; width: 90px;}' +
	'.post-menu .post-submenu>ul{white-space: nowrap; width: auto;}' +
	'.post-menu li {cursor: pointer; position: relative; padding: 4px 4px; vertical-align: middle;}\n' +
	'.post-menu li:hover {background-color: '+ cssStyle.hoverBg +';}\n' +
	'.post-menu ul ul {display: none; position: absolute;}\n' +
	'.post-menu li:hover>ul {display: block; left: 100%; margin-top: -3px;}\n' +
	'.post-menu-arrow {float: right; margin-left: 10px;}\n' +
	'.post-menu.hidden, .post-menu .hidden {display: none;}\n' +
	'.post-btn {transition: transform 0.1s; width: 15px; text-align: center; font-size: 10pt; opacity: 0.8; text-decoration: none; margin: -6px 0px 0px -5px !important; display: inline-block;}\n' +
	'.post-btn:hover {opacity: 1;}\n' +
	'.post-btn-open {transform: rotate(90deg);}\n';

if (!$('style.generated-css').length) $('<style class="generated-css">').appendTo('head');
$('style.generated-css').html($('style.generated-css').html() + cssString);

/*  Add buttons
 */
$('.reply:not(.hidden), .thread>.op').each(function () {
	addButton(this);
 });

 /*  event handlers
  */
$('form[name=postcontrols]').on('click', '.post-btn', function (e) {
	e.preventDefault();
	var post = e.target.parentElement.parentElement;
	$('.post-menu').remove();

	if ($(e.target).hasClass('post-btn-open')) {
		$('.post-btn-open').removeClass('post-btn-open');
	} else {
		//  close previous button
		$('.post-btn-open').removeClass('post-btn-open');
		$(post).find('.post-btn').addClass('post-btn-open');

		buildMenu(e);
	}
});

$(document).on('click', function (e){
	if ($(e.target).hasClass('post-btn') || $(e.target).hasClass('post-submenu'))
		return;

	$('.post-menu').remove();
	$('.post-btn-open').removeClass('post-btn-open');
});

// on new posts
$(document).on('new_post', function (e, post) {
	addButton(post);
});

window.Menu = Menu;
})();