import $ from 'jquery';
import Player from '../helpers/Player';

class Sample {

  /** @type string */
  id;

  /** @type string */
  file;

  /** @type string */
  name;

  /** @type number */
  mtime;

  /** @type jQuery */
  $sample;

  /** @type jQuery */
  $progress;

  constructor(data) {
    this.id = data.id;
    this.file = data.file;
    this.name = data.name;
    this.mtime = data.mtime;

    this.playerId = Player.registerSample({
      file: this.file,
      onPlay: () => {
        this.$sample.addClass('sample--playing');
      },
      onStop: () => {
        this.$sample.removeClass('sample--playing');
      },
      onProgress: (progress) => {
        this.$progress.css('flex-basis', `${progress}%`);
      },
    });

    this.createElements();
    this.bindEvents();
  }

  createElements() {
    const $sample = this.$sample = $('<div />')
      .addClass('sample');

    $sample.append($('<div />')
      .addClass('sample__name')
      .text(this.name)
    );

    // $sample.append($('<div />')
    //   .addClass('sample__location')
    //   .text(this.location)
    // );

    const $progress = this.$progress = $('<div />')
      .addClass('sample__progress');

    $sample.append($('<div />')
      .addClass('sample__progress-container')
      .append($progress)
    );
  }

  bindEvents() {
    const { $sample } = this;

    // Preload sound when the user hovers over the sample for more than 150ms
    let hoverTimer;

    $sample.on('mouseenter', () => {
      if (Player.isUnloaded(this.playerId)) {
        hoverTimer = setTimeout(() => {
          Player.load(this.playerId);
        }, 150);
      }
    });

    $sample.on('mouseleave', () => {
      clearTimeout(hoverTimer);
    });

    // Preload the sound when the user presses down on the sample
    $sample.on('mousedown touchstart', () => {
      Player.load(this.playerId);
    });

    // Play the sound on click
    $sample.on('click', (e) => {
      const multiple = e.shiftKey;
      const loop = e.ctrlKey;

      Player.play(this.playerId, multiple, loop);
    });

    $sample.on('contextmenu', (e) => {
      e.preventDefault();
      Player.stop(this.playerId);
    });
  }

}

export default Sample;
