import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-pastilla-estado',
  imports: [
    CommonModule
  ],
  templateUrl: './pastilla-estado.component.html',
  styleUrls: []
})
export class PastillaEstadoComponent implements OnInit {

  constructor() { }

  @Input() activo: boolean = true;

  ngOnInit(): void {}

}
