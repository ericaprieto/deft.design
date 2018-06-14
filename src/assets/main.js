$(function()
{
	var sendindEmail = false;
	var $body = $('body');
	var $title = $('title');
	var $content = $('.content');
	var $progressBar = $('.progress-bar');

	if(window.navigator.userAgent.toLowerCase().indexOf('chrome') > -1)
	{
		$body.addClass('chrome');
	}

	function getCurrentPage()
	{
		return document.location.pathname.substr(1);
	}

	$(window).on('popstate', function(event)
	{
		gotoPage(getCurrentPage(), false);
	});

	function gotoPage(page, pushState)
	{
		if(!history.pushState)
		{
			return window.location.href = page;
		}

		var onRequestStarted = function(e)
		{
			console.log(1);
			$progressBar
				.css({ opacity: 1, width: 0 })
				.animate({ width: '30%' }, 500);
		};

		var onRquestProgress = function(e)
		{
			var percent = e.loaded / e.total * 100;

			if(percent > 30)
			{
				$progressBar
					.stop()
					.clearQueue()
					.animate({ width: (percent * 0.7) + '%' }, 100);
			}
		};

		var onRquestLoaded = function()
		{

		};

		var onContentRendered = function()
		{
			$progressBar
				.stop()
				.clearQueue()
				.animate({ width: '100%' }, 200)
				.animate({ opacity: 0 }, 600);
		};

		var request = $.ajax(
		{
			url: page,
			xhr: function()
			{
				var xhr = jQuery.ajaxSettings.xhr();

				if(xhr instanceof window.XMLHttpRequest)
				{
					onRequestStarted();
					xhr.addEventListener('progress', onRquestProgress, false);
					xhr.addEventListener('load', onRquestLoaded, false);
				}

				return xhr;
			}
	    });

		var changeContent = function()
		{
			$content
				.addClass('close')
				.animate({ opacity: 0 }, 500, null, function()
			{
				request.then(function(result)
				{
					var page		= $(result);
					var bodyClass	= result.match(/<body class="(.*?)">/)[1];
					var title		= result.match(/<title>(.*?)<\/title>/)[1];
					var html		= page.find('.content').html();

					$title.html(title);
					$body.attr('class', bodyClass);

					$content
						.html(html)
						.css({ display: 'block' })
						.animate({ opacity: 1 }, 500)
						.removeClass('close');


					onContentRendered();
				})
				.catch(function()
				{
					window.location.href = 'index.html';
				});
			});
		}

		if($body.scrollTop() > 100)
		{
			$body.animate({ scrollTop: 0 }, 600);
		}

		changeContent();

		if(pushState !== false)
		{
			history.pushState({}, page, page);
			ga('send', 'pageview', window.pathname = '/' + page);
		}

		$('.menu a[href="' + page + '"]')
			.parent()
			.addClass('active')
			.siblings()
			.removeClass('active');
	}

	$body.on('click', '.mobile-menu-toggle', function(e)
	{
		e.preventDefault();
		$body.toggleClass('mobile-menu-open');
	});

	$body.on('click', '.internal-link', function(e)
	{
		e.preventDefault();
		this.blur();

		var page = this.getAttribute('href');
		
		if(page != getCurrentPage())
		{
			gotoPage(page);
			setTimeout(function(){ $body.removeClass('mobile-menu-open'); }, 600);
		}
		else
		{
			$body.removeClass('mobile-menu-open');
		}
	});

	$body.on('focus', 'input,textarea', function(e)
	{
		$(e.target.parentNode).addClass('focus');
	});

	$body.on('blur', 'input,textarea', function(e)
	{
		$(e.target.parentNode).removeClass('focus');
	});

	$body.on('click', '.btn-send', function(e)
	{
		this.blur();

		var subject = $('[name="subject"]').val();
		// var name = $('[name="name"]').val();
		var email = $('[name="email"]').val();
		var message = $('[name="message"]').val();

		if(sendindEmail) return;
		if(!subject || /*!name ||*/ !email || !message) return alert('Por favor, preencha todos os campos.');

		sendindEmail = true;

		$.post(
		{
			url: 'https://formspree.io/hello@deft.design',
			dataType: 'json',
			data:
			{
				_subject: subject,
				_replyto: email,
				// name: name,
				email: email,
				message: message
			},
			complete: function(xhr)
			{
				if(xhr.status == 0 || xhr.status == 200)
				{
					alert('Seu email foi enviado com sucesso e responderemos em breve.');

					$('[name="subject"]').val('');
					// $('[name="name"]').val('');
					$('[name="email"]').val('');
					$('[name="message"]').val('');
				}
				else
				{
					alert('Desculpe, mas ocorreu um erro ao enviar o email. Se possível, envie sua mensagem diretamente para hello@deft.design ou ligue para ' + _tel);
				}

				sendindEmail = false;
			}
		});
	});
});