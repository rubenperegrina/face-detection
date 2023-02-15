import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { FaceApiService } from 'src/app/services/face-api.service';
import { VideoPlayerService } from 'src/app/services/video-player.service';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss']
})
export class VideoPlayerComponent implements OnInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  @Output() dataAI: EventEmitter<any> = new EventEmitter<any>();
  loadedModels!: boolean;
  public listSubscribers: any = [];
  previewCanvas: any;
  resizedDetections!: any;
  @Input() width!: number;
  @Input() height!: number;
  @Input() source: any;
  currentColor = 'white';

  @HostListener('document:click', ['$event'])
  cbOver(res: { clientX: any; }): any {
    console.log(res.clientX);
  };

  constructor(
    private faceApiService: FaceApiService,
    private videoPlayerService: VideoPlayerService,
    private renderer2: Renderer2,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    this.faceApiService.loadedModels.subscribe((res) => {
      if (res) {
        this.loadedModels = true;
        this.checkFace();
      }
    });

    this.listObserver();
  }

  listObserver = () => {
    const observer1$ = this.videoPlayerService.cbAi.subscribe(
      ({ resizedDetections, displaySize, eyes }) => {
        this.resizedDetections = resizedDetections[0];
        if (resizedDetections[0]) {
          this.drawAi(resizedDetections[0], displaySize, eyes);
        }
      });

    this.listSubscribers.push(observer1$);
  };

  checkFace = () => {
    setInterval(async () => {
      await this.videoPlayerService.getLandMark(this.videoElement);
    }, 100);
  };

  drawAi = (resizedDetections: any, displaySize: { width: number; height: any; }, eyes: {
    left: {
      x: number; y: number;
    }[];
  }) => {
    this.previewCanvas.getContext('2d').clearRect(0, 0, displaySize.width, displaySize.height);
  };

  private b64toBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([ab], { type: 'image/png' }));
  };

  saveToImage = () => {
    const canvas: HTMLElement | any = document.getElementById('canvas');
    const video = this.videoElement.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    console.log(canvas);
    const dataURL = canvas.toDataURL();
    const response = this.b64toBlob(dataURL);
    window.open(response, '_blank');
  };


  listenerPlay = () => {
    const { globalFace } = this.faceApiService;
    this.previewCanvas = globalFace.createCanvasFromMedia(this.videoElement.nativeElement);
    this.renderer2.setProperty(this.previewCanvas, 'id', 'new-canvas-preview-big');
    this.renderer2.setStyle(this.previewCanvas, 'width', `${this.width}px`);
    this.renderer2.setStyle(this.previewCanvas, 'height', `${this.height}px`);
    this.renderer2.appendChild(this.elementRef.nativeElement, this.previewCanvas);

    this.dataAI.emit({ interface: this.videoElement.nativeElement });
  };

  loadedMetaData = () => {
    this.videoElement.nativeElement.play();
  };
}