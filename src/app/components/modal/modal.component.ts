import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, HostListener, ElementRef, Renderer2, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent implements OnInit {

  @Input() showModal = false; // Control de modal
  @Input() titulo = 'Titulo de modal';
  @Input() urlIcono = '';
  @Input() estadoFormulario = 'crear';
  @Input() textoCrear = 'Crear';
  @Input() textoActualizar = 'Actualizar';
  @Input() showFooter = true;
  @Input() showEliminar = false;
  @Input() showImprimir = false;

  @Output() closeModal = new EventEmitter<any>();
  @Output() crear = new EventEmitter<any>();
  @Output() actualizar = new EventEmitter<any>();
  @Output() eliminar = new EventEmitter<any>();
  @Output() imprimir = new EventEmitter<any>();

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit() { }

  // Evento: Posicion de cursor
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;
      const modalContent = this.el.nativeElement.querySelector('.modal-content');
      if (modalContent) {
        this.renderer.setStyle(modalContent, 'left', `${this.initialLeft + dx}px`);
        this.renderer.setStyle(modalContent, 'top', `${this.initialTop + dy}px`);
      }
    }
  }

  // Evento: Soltar el mouse
  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.isDragging = false;
  }

  // Evento: Presionar el mouse
  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    const modalContent = this.el.nativeElement.querySelector('.modal-content');
    if (modalContent) {
      this.initialLeft = modalContent.offsetLeft;
      this.initialTop = modalContent.offsetTop;
    }
  }

  imprimirItem(): void {
    this.imprimir.emit();
  }

  cerrarModal(): void {
    this.closeModal.emit();
  }

  crearItem(): void {
    this.crear.emit();
  }

  actualizarItem(): void {
    this.actualizar.emit();
  }

  eliminarItem(): void {
    this.eliminar.emit();
  }


}
