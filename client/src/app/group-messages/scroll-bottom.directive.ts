import { Directive, ElementRef, AfterViewChecked } from '@angular/core';

@Directive({
    selector: '[appScrollBottom]'
})
export class ScrollBottomDirective implements AfterViewChecked {

    constructor(private el: ElementRef) { }

    ngAfterViewChecked() {
        this.el.nativeElement.scrollTop = this.el.nativeElement.scrollHeight;
    }
}
