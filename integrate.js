/*
 * Copyright 2015-2018 Jiří Janoušek <janousek.jiri@gmail.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

(function (Nuvola) {
  // Create media player component
  var player = Nuvola.$object(Nuvola.MediaPlayer)

  // Handy aliases
  var PlaybackState = Nuvola.PlaybackState
  var PlayerAction = Nuvola.PlayerAction

  // Translations
  var C_ = Nuvola.Translate.pgettext

  // Custom action
  var ACTION_LIKE = 'like'

  // Create new WebApp prototype
  var WebApp = Nuvola.$WebApp()

  WebApp._onInitAppRunner = function (emitter) {
    Nuvola.WebApp._onInitAppRunner.call(this, emitter)
    Nuvola.actions.addAction('playback', 'win', ACTION_LIKE, C_('Action', 'Like track'), null, null, null, true)
  }

  // Initialization routines
  WebApp._onInitWebWorker = function (emitter) {
    Nuvola.WebApp._onInitWebWorker.call(this, emitter)

    var state = document.readyState
    if (state === 'interactive' || state === 'complete') {
      this._onPageReady()
    } else {
      document.addEventListener('DOMContentLoaded', this._onPageReady.bind(this))
    }
  }

  // Page is ready for magic
  WebApp._onPageReady = function () {
    // Connect handler for signal ActionActivated
    Nuvola.actions.connect('ActionActivated', this)

    this.state = PlaybackState.UNKNOWN
    player.setCanGoPrev(false)
    player.addExtraActions([ACTION_LIKE])

    // Start update routine
    this.update()
  }

  // Extract data from the web page
  WebApp.update = function () {
    /* Fox for white flash container */
    if (!this.flashFixed) {
      var movieContainer = document.querySelector('div.movieContainer')
      if (movieContainer) {
        movieContainer.style.visibility = 'hidden'
        this.flashFixed = true
      }
    }

    var track = {
      title: null,
      artist: null,
      album: null,
      artLocation: null
    }

    var buttons = this.getButtons()
    this.state = this.getState()
    player.setCanPause(!!buttons.pause)
    player.setCanPlay(!!buttons.play)
    player.setCanGoNext(this.state !== PlaybackState.UNKNOWN && buttons.skip)
    track.title = Nuvola.queryText('#now_playing .title_artist .t')
    track.artist = Nuvola.queryText('#now_playing .title_artist .a')
    track.album = Nuvola.queryText('#now_playing .album .detail')
    track.artLocation = Nuvola.queryAttribute(
      '#player_mix img.cover', 'src', (src) => src.replace(/w=\d+&h=\d+/, 'w=500&h=500'))
    player.setTrack(track)
    player.setPlaybackState(this.state)

    Nuvola.actions.updateEnabledFlag(ACTION_LIKE, !!buttons.like)
    Nuvola.actions.updateState(ACTION_LIKE, !!(buttons.like && buttons.like.classList.contains('active')))

    // Schedule the next update
    setTimeout(this.update.bind(this), 500)
  }

  WebApp.getButtons = function () {
    var skip = document.getElementById('player_skip_button') || document.getElementById('youtube_skip_button')
    var like = document.getElementById('player_like_button') || document.getElementById('youtube_like_button')
    switch (this.getState()) {
      case PlaybackState.PAUSED:
        return {
          play: document.getElementById('player_play_button') || document.getElementById('youtube_play_button'),
          skip: skip,
          like: like
        }
      case PlaybackState.PLAYING:
        return {
          pause: document.getElementById('player_pause_button') || document.getElementById('youtube_pause_button'),
          skip: skip,
          like: like
        }
      default:
        return {
          play: document.querySelector('#play_on_youtube') || document.querySelector('#play_overlay .quick_play')
        }
    }
  }

  WebApp.getState = function () {
    var elm = document.getElementById('mix_youtube')
    if (!elm || elm.style.display === 'none') {
      return PlaybackState.UNKNOWN
    }
    return elm.classList.contains('playing') ? PlaybackState.PLAYING : PlaybackState.PAUSED
  }

  // Handler of playback actions
  WebApp._onActionActivated = function (emitter, name, param) {
    var buttons = this.getButtons()
    switch (name) {
      case PlayerAction.TOGGLE_PLAY:
        if (this.state === PlaybackState.PLAYING) {
          Nuvola.clickOnElement(buttons.pause)
        } else {
          Nuvola.clickOnElement(buttons.play)
        }
        break
      case PlayerAction.PLAY:
        Nuvola.clickOnElement(buttons.play)
        break
      case PlayerAction.PAUSE:
      case PlayerAction.STOP:
        Nuvola.clickOnElement(buttons.pause)
        break
      case PlayerAction.NEXT_SONG:
        Nuvola.clickOnElement(buttons.skip)
        break
      case ACTION_LIKE:
        Nuvola.clickOnElement(buttons.like)
        break
    }
  }

  WebApp.start()
})(this)  // function(Nuvola)
