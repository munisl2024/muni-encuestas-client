import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  standalone: true,
  selector: 'app-loader',
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit {

  public show = false;
  public showBar = false;

  constructor(
    private router: Router,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.router.events.subscribe({
      next: (event) => {
        if(event instanceof NavigationStart) { // Comienzo de navegacion
          this.show = true;
        }else if(event instanceof NavigationEnd) { // Fin de navegacion
          window.scrollTo(0, 0);
          this.show = false;
          this.dataService.showMenu = false;
        }
      }
    })
  }

}
