import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import * as _ from 'lodash';
import { FaceApiService } from './services/face-api.service';
import { VideoPlayerService } from './services/video-player.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private renderer2: Renderer2,
    private faceApiService: FaceApiService,
    private videoPlayerService: VideoPlayerService) { }

  public listSubscribers: any = [];
  public currentStream!: MediaStream;
  public dimensionVideo!: { width: number, height: number };
  public previewCanvas: any;
  public listExpressions: any;

  ngOnInit(): void {
    this.checkMediaSource();
    this.getSizeCam();
    this.listObserver();
  }

  ngOnDestroy(): any {
    this.listSubscribers.forEach((a: { unsubscribe: () => any; }) => a.unsubscribe());
  }

  getSizeCam = () => {
    const element: HTMLElement = document.querySelector('.cam')!;
    const { width, height } = element.getBoundingClientRect();
    this.dimensionVideo = { width, height };

  };

  checkMediaSource = () => {
    if (navigator && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({
        video: true
      }).then(stream => {
        this.currentStream = stream;
      }).catch(() => {
        alert('Algo ha ocurrido obteniendo el video');
      });
    } else {
      alert('No existe camara');
    }
  };


  getAI($event: any): any {
    const { globalFace } = this.faceApiService;
    this.previewCanvas = globalFace.createCanvasFromMedia($event.interface);
    this.renderer2.setProperty(this.previewCanvas, 'id', 'new-canvas-preview');
    const blockPreview = document.querySelector('.space-preview');
    this.renderer2.appendChild(blockPreview, this.previewCanvas);
  }

  listObserver = () => {
    const { globalFace } = this.faceApiService;
    const observer1$ = this.videoPlayerService.cbAi.subscribe(({ resizedDetections, displaySize, expressions }) => {
      resizedDetections = resizedDetections[0];
      this.listExpressions = _.map(expressions, (value, key) => {
        return {
          name: key,
          value
        };
      });
      this.previewCanvas.getContext('2d').clearRect(0, 0, displaySize.width, displaySize.height);
      globalFace.draw.drawFaceLandmarks(this.previewCanvas, resizedDetections);
    });

    this.listSubscribers.push(observer1$);
  };
}