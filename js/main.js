(function($, document, undefined){
	$(function(){
		"use strict";

		function transitionEndEventName() {
			var i,
				undefined,
				el = document.createElement('div'),
				transitions = {
					'transition':'transitionend',
					'OTransition':'otransitionend',  // oTransitionEnd in very old Opera
					'MozTransition':'transitionend',
					'WebkitTransition':'webkitTransitionEnd'
				};

			for (i in transitions) {
				if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
					return transitions[i];
				}
			}

		}
		// Calendar setup
		var calendarInput = $('#modal-calendar').pickadate(),
			picker = calendarInput.pickadate('picker'),
			transitionEndEvent = transitionEndEventName();

		picker.set('min', new Date());
		picker.on('set', function(set) {
			console.log(set);
		});


		// Time selected
		var timeSelect = $('.modal-time');

		$('input[type=checkbox][data-group-id]', timeSelect).on('change', function(e, callObj) {
			var self = $(this),
				cell = self.closest('.modal-time-cell'),
				nextCell = cell.next(),
				prevCell = cell.prev(),
				rowSize = window.innerWidth <= 320 ? 3 : 4,
				maxRows = Math.ceil( $('.modal-time-cell', cell.parent()).size() / rowSize ),
				curCellIndex = cell.index(),
				topCell, bottomCell, selectRow = Math.ceil(curCellIndex / rowSize );

				topCell = curCellIndex+1 <= rowSize ? undefined : $( '.modal-time-cell:nth('+ ( (curCellIndex - (selectRow-1)*rowSize)+(selectRow-2)*rowSize ) +')' ),
				bottomCell = selectRow < maxRows ? $( '.modal-time-cell:nth('+ ( (curCellIndex - (selectRow-1)*rowSize)+ selectRow*rowSize ) +')' ) : undefined;

			console.log(((curCellIndex - (selectRow-1)*rowSize)+(selectRow-2)*rowSize ), topCell, bottomCell);
			if ( self.is(':checked') ) {
				if ( !!topCell && topCell.hasClass('checked') ) {
					topCell.addClass('has-bottom');
					cell.addClass('has-top')
				}
				if ( !!bottomCell && bottomCell.hasClass('checked') ) {
					bottomCell.addClass('has-top');
					cell.addClass('has-bottom')
				}
				if ( !!nextCell && nextCell.hasClass('checked') ) {
					nextCell.addClass('has-left');
					cell.addClass('has-right')
				}
				if ( !!prevCell && prevCell.hasClass('checked') ) {
					prevCell.addClass('has-right');
					cell.addClass('has-left')
				}
				cell.addClass('checked');
			} else {
				if ( !!topCell && topCell.hasClass('checked') ) {
					topCell.removeClass('has-bottom');
					cell.removeClass('has-top')
				}
				if ( !!bottomCell && bottomCell.hasClass('checked') ) {
					bottomCell.removeClass('has-top');
					cell.removeClass('has-bottom')
				}
				if ( !!nextCell && nextCell.hasClass('checked') ) {
					nextCell.removeClass('has-left');
					cell.removeClass('has-right')
				}
				if ( !!prevCell && prevCell.hasClass('checked') ) {
					prevCell.removeClass('has-right');
					cell.removeClass('has-left')
				}
				cell.removeClass('checked');
			}

			if ( !callObj ) {
				clearGroupLabel();
				clearFreeTime();
			} else {
				if ( callObj.attributes['data-group'] ) {
					clearFreeTime();
				}
				if ( /\bfree-time\\b/.test( callObj.className ) ) {
					clearGroupLabel();
				}
			}

		});


		$('a[data-group]', timeSelect).on('click', function(e) {
			e.preventDefault();
			var self = $(this),
				groupId = self.attr('data-group'),
				conteiner = self.closest( '.modal-time' ),
				allGroupLink = $('a[data-group]', conteiner);

			clearSelectTime( this );
			clearFreeTime();
			self.addClass('active');
			$('input[type=checkbox][data-group-id]', conteiner).filter(function() {
				return !this.disabled && groupId == this.attributes['data-group-id'].value;
			}).prop('checked', true).trigger('change', this);
		});

		$('.free-time', timeSelect).on('change', function() {
			clearSelectTime( this );
		});

		function clearSelectTime( callObj ) {
			callObj = callObj || false;
			clearGroupLabel();
			$('input[type=checkbox][data-group-id]', '.modal-time').prop('checked', false).trigger('change', callObj);
		}

		function clearGroupLabel() {
			$('a[data-group]', timeSelect).removeClass('active');
		}

		function clearFreeTime() {
			$('.free-time', '.modal-time').prop('checked', false);
		}

		// Scroll

		var dialogScrollPane = $('.dialog-window-content').jScrollPane().data('jsp').reinitialise(),
			leftContentScrollPane = $('.side-section-content').jScrollPane().data('jsp').reinitialise();


		//var dialogScrollPane = $('.scroll_pane').jScrollPane().data('jsp').reinitialise(),
		//leftContentScrollPane = $('.scroll_contant').jScrollPane().data('jsp').reinitialise();


		// Dialog
		var dialogWindow = $('#dialog-window'),
			modalWindow = $('.modal'),
			section;

		$('input[type=radio], input[type=checkbox]', dialogWindow).on('change', function(e) {
			var self = $(this);

			self.closest('.list-item').trigger('change-item', this);
		});

		$('.list-item', dialogWindow).on('change-item', function(e, el) {
			var self = $(this);

			$('input[name="'+ $(el).attr('name') +'"][type=radio]', dialogWindow).closest('.list-item').removeClass('selected').find('.remove-item').remove();

			self.addClass('selected').append('<div class="remove-item"/>');
		}).on('change-item', function( e, el ){
			var self = $(this), isOneCheck = false;

			if ( $(el).closest('.select-specialization').length > 0) {
				dialogWindow.trigger('close-dialog');
				$('.side-section-content', section).trigger('append-content', [$(el).closest('.list-item').clone(), 'simple-list']);
				return false;
			}

			if ( $( 'input[type=radio], input[type=checkbox]', dialogWindow ).is(':checked') && !isOneCheck ) {
				isOneCheck = true;
				dialogWindow.addClass('show-footer');
				recalcScrollPaneHeight( $(this ), dialogScrollPane);
			}
		});

		$('.list-item', dialogWindow).on('remove-item-el', function(){
			if ( $('input[type=radio]:checked, input[type=checkbox]:checked', dialogWindow).length == 0 ) {
				dialogWindow.removeClass('show-footer');

				recalcScrollPaneHeight( $(this ), dialogScrollPane);
			}
		});

		$('.modal-left-side').on('remove-item-el', '.list-item', function(e) {
			var self = $(this),
				itemConteiner = self.parent();

			if ( $( '.list-item', itemConteiner).length == 1 ) {
				itemConteiner.remove();
			}
		});


		modalWindow.on('click', '.remove-item', function(e) {
			e.preventDefault();

			var self = $(this),
				item = self.closest('.list-item');
			if ( self.closest('.modal-left-side').length > 0 ) {
				// Left side handlers
				item.trigger('remove-item-el').remove();
			} else  if ( self.closest('.dialog-window-content').length > 0 ) {
				// modal dialog handlers
				item.removeClass('selected').find('input').prop('checked', false).trigger('remove-item-el');
				self.remove();
			}

		});

		dialogWindow.on( 'footer-toggle', function(e, show) {
			var self = $(this);
			dialogScrollPane.reinitialise();
		});


		$('.dialog-close').on('click', function() {
			dialogWindow.trigger('close-dialog');
		});

		dialogWindow.on('close-dialog', function() {
			var self = $(this);

			self.removeClass('open');
			$('.side-section-header', '.modal-dialog').removeClass('open-dialog');
		});

		$('[data-dialog]').on('click', function() {

			var self = $(this),
				currentSection = self.closest('.side-section'),
				dialogCenter = Math.floor( dialogWindow.outerHeight()/2 ),
				dialofOffset = dialogWindow.position(),
				dialogHandlerPoint = $('.side-section-header', currentSection).position().top + 5,
				modalHeight = $('.modal-dialog').outerHeight(),
				dialofOffsetTop = 105, lock = false;

			section = undefined;

			// Set dialog position
			if ( dialogHandlerPoint - dialogCenter > 105 ) {
				dialofOffsetTop = dialogHandlerPoint - dialogCenter;
			}
			if ( modalHeight - ( dialogHandlerPoint + dialogCenter ) < 10 ) {
				dialofOffsetTop = modalHeight - 10 - dialogCenter*2;
			}

			var showDialog = function() {
				dialogWindow.css('top', dialofOffsetTop )
				dialogWindow.addClass('open');
				$('.side-section-header', currentSection).addClass('open-dialog');

				section = currentSection;
			}

			if ( 'undefined' !== typeof section) {

				dialogWindow.removeClass('open');
				$('.side-section-header', '.modal-dialog').removeClass('open-dialog');
			} else {
				showDialog();
			}

			dialogWindow.on(transitionEndEvent, function(e){
				if ( !lock ) {
					lock = true;
					showDialog();
				}
			});

			return false;
		});

		$('[data-clear-select]', dialogWindow).on('click', function() {
			$( '.remove-item', dialogWindow ).trigger('click');

			return false;
		});

		$('[data-apply-select]').on('click', function() {
			var list = $('.list-item.selected', dialogWindow);

			$('.side-section-content-inner', section).trigger('append-content', [list.clone()]);
			return false;
		});

		$('.modal-dialog').on('append-content', '.side-section-content-inner', function(e, content, list_class) {
			content.removeClass('selected');
			list_class = list_class || '';
			if( content.is('li') ) {
				content = $('<ul/>').addClass(list_class).append(content);
			}
			$(this).html(content.wrap('<ul/>'));

		});

		$( '.select-list').on('change', 'input', function() {
			var self = $(this),
				inputId = self.attr('id');

			recalcScrollPaneHeight( $('label[for="'+inputId+'"]') );
		});

		function recalcScrollPaneHeight( el, scrollPane ) {

			var scrollPane = scrollPane || el.closest('.dialog-window-content').data('jsp'),
				footer = $( '.dialog-footer', el.closest('#dialog-window'));

			footer.on(transitionEndEvent, function() {
				scrollPane.reinitialise();
			});
		}


		$(document).on('hide.bs.modal', '.modal', function(e) {
			var self = $(this),
				modal = self.data('bs.modal');


			var close = modal.closeDialog || false;
			if ( close ) {
				modal.closeDialog = undefined;
				return;
			}

			if( 'request-dialog' == $(e.target).attr('id') ) {
				e.preventDefault();
				var closeDialog = $('#close-dialog').clone();
				$( '.modal-dialog', e.target).after( closeDialog );
				closeDialog.css({'opacity': 1});
			}
		});

		$(document).on('click', '.button.return', function(e) {
			e.preventDefault();

			$(this).closest('#close-dialog').css('opacity', 0).on(transitionEndEvent, function() {
				$(this).remove();
			});
		}).on('click', '.button.close-dialog', function(e) {
			e.preventDefault();

			var self = $(this),
				modal = self.closest('.modal').data('bs.modal');

			modal['closeDialog'] = true;

			modal.hide();

			modal.$element.on('hidden.bs.modal', function() {
				self.closest('#close-dialog').remove();
			});

		});
		// radio
		$('#radio1').click( function () {
			$('.this-text1').addClass('is-active_color');
			$('.radio-text_hide1').addClass('is-active');
		});
		$('#radio2').click( function () {
			$('.this-text2').addClass('is-active_color');
			$('.radio-text_hide2').addClass('is-active');
		});
		$('#radio3').click( function () {
			$('.this-text3').addClass('is-active_color');
			$('.radio-text_hide3').addClass('is-active');
		});

		//tabs
		$('.js-btn-info').click( function () {
			$('.js-content-hide').slideToggle('fast');
			$('.tab-close').toggleClass('tab-active_info');
			//event.stopPropagation();
			return false;
		});
		$('.js-btn-cal').click( function () {
			$('.modal-calendar').slideToggle('fast');
			$('.tab-close__calendar').toggleClass('tab-active_calendar');
			//event.stopPropagation();
			return false;
		});

		$('.js-btn-time').click( function () {
			$('.modal-time').slideToggle('fast');
			$('.tab-close__time').toggleClass('tab-active_calendar');
			//event.stopPropagation();
			return false;
		});



	});
}(jQuery, document));