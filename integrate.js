/*
 * Copyright 2015 Jiří Janoušek <janousek.jiri@gmail.com>
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

  // Create new WebApp prototype
  var WebApp = Nuvola.$WebApp()

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
    if (buttons.play && buttons.play.style.display !== 'none') {
      this.state = PlaybackState.PAUSED
      player.setCanPause(false)
      player.setCanPlay(true)
    } else if (buttons.pause && buttons.pause.style.display !== 'none') {
      this.state = PlaybackState.PLAYING
      player.setCanPause(true)
      player.setCanPlay(false)
    } else {
      this.state = PlaybackState.UNKNOWN
      player.setCanPause(false)
      player.setCanPlay(false)
    }

    player.setCanGoNext(this.state !== PlaybackState.UNKNOWN && buttons.skip && buttons.skip.style.display !== 'none')

    try {
      track.title = document.querySelector('.track.now_playing .title_artist .t').innerText
      track.artist = document.querySelector('.track.now_playing .title_artist .a').innerText
      track.album = document.querySelector('.track.now_playing .album .detail').innerText
      track.artLocation = document.querySelector('#player_mix img.cover').src.replace(/w=\d+&h=\d+/, 'w=500&h=500')
    } catch (e) {
        // ~ console.log(e);
    }

    player.setTrack(track)
    player.setPlaybackState(this.state)

    // Schedule the next update
    setTimeout(this.update.bind(this), 500)
  }

  WebApp.getButtons = function () {
    return {
      play: document.getElementById('player_play_button') || document.querySelector('#play_overlay .quick_play'),
      pause: document.getElementById('player_pause_button'),
      skip: document.getElementById('player_skip_button')
    }
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
    }
  }

  WebApp.start()
})(this)  // function(Nuvola)
