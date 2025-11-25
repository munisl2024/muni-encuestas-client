import { Component, EventEmitter, Output } from '@angular/core';
import { BarriosService } from '../../../services/barrios.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../components/modal/modal.component';

@Component({
  selector: 'app-abm-barrios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent
  ],
  templateUrl: './abmBarrios.component.html',
})
export default class AbmBarriosComponent {

  @Output() insertEvent = new EventEmitter<any>();
  @Output() updateEvent = new EventEmitter<any>();

  constructor(public barriosService: BarriosService) { }

  onSubmit(): void {
    if (this.barriosService.estadoAbm === 'crear') {
      this.insertEvent.emit(this.barriosService.abmForm);
    } else {
      this.updateEvent.emit(this.barriosService.abmForm);
    }
  }

  cerrarModal(): void {
    this.barriosService.cerrarAbm();
  }

}
