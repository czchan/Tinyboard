/*
 * post-hover.js
 * https://github.com/savetheinternet/Tinyboard/blob/master/js/post-hover.js
 *
 * Released under the MIT license
 * Copyright (c) 2012 Michael Save <savetheinternet@tinyboard.org>
 *
 * Usage:
 *   $config['additional_javascript'][] = 'js/jquery.min.js';
 *   $config['additional_javascript'][] = 'js/post-hover.js';
 *
 */

onready(function(){
	var dont_fetch_again = [];
	init_hover = function() {
		var $link = $(this);
		
		var id;
		var matches;

		if(matches = $link.text().match(/^>>(?:>\/([^\/]+)\/)?(\d+)$/)) {
			id = matches[2];
		} else {
			return;
		}
		
		var board = $(this);
		while (board.data('board') === undefined) {
			board = board.parent();
		}
		var threadid = board.attr('id').replace("thread_", "");
		board = board.data('board');

		var parentboard = board;

		if (matches[1] !== undefined) {
			board = matches[1];
		}


		var $post = false;
		var hovering = false;
		var hovered_at;
		$link.hover(function(e) {
			hovering = true;
			hovered_at = {'x': e.pageX, 'y': e.pageY};
			
			var start_hover = function($link) {
				if($.contains($post[0], $link[0])) {
					// link links to itself or to op; ignore
				}
				else if($post.is(':visible') &&
						$post.offset().top + $post.height() >= $(window).scrollTop() &&
						$post.offset().top <= $(window).scrollTop() + $(window).height()) {
					// post is in view
					$post.attr('style', 'border-style: none dashed dashed none; background: ' + $post.css('border-right-color'));
				} else {
					var $newPost = $post.clone();
					$newPost.find('>.reply, >br').remove();
					$newPost.find('span.mentioned').remove();

					$newPost
						.attr('id', 'post-hover-' + id)
						.attr('data-board', board)
						.addClass('post-hover')
						.css('position', 'absolute')
						.css('border-style', 'solid')
						.css('box-shadow', '1px 1px 1px #999')
						.css('display', 'block')
						.addClass('reply').addClass('post')
						.insertAfter($link.parent())
					$link.trigger('mousemove');
				}
			};
			
			$post = $('[data-board="' + board + '"] div.post#reply_' + id + ', [data-board="' + board + '"]div#thread_' + id);
			if($post.length > 0) {
				start_hover($(this));
			} else {
				var url = $link.attr('href').replace(/#.*$/, '');
				
				if($.inArray(url, dont_fetch_again) != -1) {
					return;
				}
				dont_fetch_again.push(url);
				
				$.ajax({
					url: url,
					context: document.body,
					success: function(data) {
						var mythreadid = $(data).find('div[id^="thread_"]').attr('id').replace("thread_", "");

						if (mythreadid == threadid && parentboard == board) {
							$(data).find('div.post.reply').each(function() {
								if($('[data-board="' + board + '"] #' + $(this).attr('id')).length == 0) {
									$('[data-board="' + board + '"]#thread_' + threadid + " .post.reply:first").before($(this).hide().addClass('hidden'));
								}
							});
						}
						else if ($('[data-board="' + board + '"]#thread_'+mythreadid).length > 0) {
							$(data).find('div.post.reply').each(function() {
								if($('[data-board="' + board + '"] #' + $(this).attr('id')).length == 0) {
									$('[data-board="' + board + '"]#thread_' + mythreadid + " .post.reply:first").before($(this).hide().addClass('hidden'));
								}
							});
						}
						else {
							$(data).find('div[id^="thread_"]').hide().attr('data-cached', 'yes').prependTo('form[name="postcontrols"]');
						}

						$post = $('[data-board="' + board + '"] div.post#reply_' + id + ', [data-board="' + board + '"]div#thread_' + id);

						if(hovering && $post.length > 0) {
							start_hover($link);
						}
					}
				});
			}
		}, function() {
			hovering = false;
			if(!$post)
				return;
			
			$post.attr('style', '');
			if($post.hasClass('hidden') || $post.data('cached') == 'yes')
				$post.css('display', 'none');
			$('.post-hover').remove();
		}).mousemove(function(e) {
			if(!$post)
				return;
			
			var $hover = $('#post-hover-' + id + '[data-board="' + board + '"]');
			if($hover.length == 0)
				return;
			
			var top = (e.pageY ? e.pageY : hovered_at['y']) - 10;
			
			if(e.pageY < $(window).scrollTop() + 15) {
				top = $(window).scrollTop();
			} else if(e.pageY > $(window).scrollTop() + $(window).height() - $hover.height() - 15) {
				top = $(window).scrollTop() + $(window).height() - $hover.height() - 15;
			}
			
			
			$hover.css('left', (e.pageX ? e.pageX : hovered_at['x'])).css('top', top);
		});
	};
	
	$('div.body a:not([rel="nofollow"])').each(init_hover);
	
	// allow to work with auto-reload.js, etc.
	$(document).bind('new_post', function(e, post) {
		$(post).find('div.body a:not([rel="nofollow"])').each(init_hover);
	});
});

