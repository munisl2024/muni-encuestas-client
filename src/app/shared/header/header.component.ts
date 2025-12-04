import { Component, HostListener, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './header.component.html',
  styleUrls: []
})
export class HeaderComponent implements OnInit {

  public showSubMenu: boolean = false;

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent) {
    this.dataService.showMenu = false;
  }

  constructor(
    public authService: AuthService,
    private alertService: AlertService,
    public dataService: DataService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void { }

  // Metodo: Cerrar sesión
  logout(): void {
    this.alertService.question({ msg: 'Cerrando sesión', buttonText: 'Aceptar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.authService.logout();
        }
      });
  }



}
