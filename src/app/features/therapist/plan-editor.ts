import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-plan-editor',
  standalone: true,
  imports: [CardModule, ButtonModule, TextareaModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto py-6">
      <div class="mb-4">
        <button (click)="goBack()" class="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-medium cursor-pointer">
          &larr; Back to Client Detail
        </button>
      </div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-gray-900">Treatment Plan Editor</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p-card header="Therapist Context">
            <p class="text-sm text-gray-600 mb-4">Add your clinical notes and instructions here. The AI will use this context to generate the structured plan.</p>
            
            <div class="flex flex-col gap-1.5 mb-4">
              <label class="text-xs font-semibold text-gray-700">Therapist Notes</label>
              <textarea pTextarea [(ngModel)]="notes" rows="6" class="w-full border rounded p-2 focus:ring-primary-500 bg-white text-gray-800" placeholder="Patient has difficulty with fine motor skills, specifically pinching. Focus on grip strengthening exercises..."></textarea>
            </div>

            <div class="space-y-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-gray-700">Client Age Range</label>
                <select [(ngModel)]="ageRange" class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Not Specified</option>
                  <option value="Pediatric (0-12)">Pediatric (0-12)</option>
                  <option value="Teen (13-19)">Teen (13-19)</option>
                  <option value="Adult (20-64)">Adult (20-64)</option>
                  <option value="Geriatric (65+)">Geriatric (65+)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-gray-700">Session Duration (mins)</label>
                  <select [(ngModel)]="sessionLength" class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option [value]="undefined">Not Specified</option>
                    <option [value]="10">10 mins</option>
                    <option [value]="15">15 mins</option>
                    <option [value]="20">20 mins</option>
                    <option [value]="30">30 mins</option>
                    <option [value]="45">45 mins</option>
                    <option [value]="60">60 mins</option>
                  </select>
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-gray-700">Available Equipment</label>
                  <input type="text" [(ngModel)]="equipment" placeholder="e.g. Putty, Bands" class="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>

            <div class="flex gap-4 mt-6">
              <button (click)="goBack()" type="button" class="flex-1 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 transition-colors text-sm font-semibold rounded-md shadow-xs cursor-pointer text-center">
                Cancel
              </button>
              <div class="flex-1">
                <p-button label="Generate with AI" icon="pi pi-sparkles" (onClick)="generate()" [loading]="isGenerating()" styleClass="w-full"></p-button>
              </div>
            </div>
          </p-card>
        </div>

        <div>
          <p-card header="Generated Plan">
            @if (generatedPlan()) {
              <div class="space-y-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{{ generatedPlan()?.title }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ generatedPlan()?.summary }}</p>
                </div>
                
                <div class="border-t pt-4">
                  <h4 class="text-md font-medium text-gray-900 mb-2">Activities</h4>
                  <ul class="space-y-3">
                    @for (act of generatedPlan()?.activities; track act.title) {
                      <li class="bg-gray-50 p-3 rounded border border-gray-100">
                        <div class="flex justify-between items-start">
                          <span class="font-medium text-gray-800">{{ act.title }}</span>
                          <span class="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded font-semibold">
                            {{ act.durationMinutes || act.duration_minutes }} mins • {{ act.frequency }}
                          </span>
                        </div>
                        <p class="text-xs text-gray-600 mt-1 whitespace-pre-line">{{ act.instructions }}</p>
                      </li>
                    }
                  </ul>
                </div>
              </div>
              <div class="mt-6 flex justify-end gap-2">
                <p-button label="Discard" severity="danger" [text]="true" (onClick)="generatedPlan.set(null)"></p-button>
                <p-button label="Save Plan" icon="pi pi-check" (onClick)="savePlan()" [loading]="isSaving()"></p-button>
              </div>
            } @else {
              <div class="text-center py-12 text-gray-500">
                Plan preview will appear here after generation.
              </div>
            }
          </p-card>
        </div>
      </div>
    </div>
  `
})
export class PlanEditorComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  goBack() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/therapist/client', id]);
    } else {
      this.router.navigate(['/therapist']);
    }
  }
  
  notes = '';
  ageRange = '';
  equipment = '';
  sessionLength?: number;

  isGenerating = signal(false);
  isSaving = signal(false);
  generatedPlan = signal<any>(null);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const intakeData = await this.api.getClientIntake(id);
        if (intakeData) {
          this.ageRange = intakeData.age_range || '';
          this.equipment = intakeData.available_equipment || '';
          this.sessionLength = intakeData.session_length_minutes || undefined;
        }
      } catch (e) {
        console.error('Failed to load client intake answers', e);
      }
    }
  }

  async generate() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isGenerating.set(true);
    try {
      const options = {
        age_range: this.ageRange || undefined,
        available_equipment: this.equipment || undefined,
        session_length_minutes: this.sessionLength ? Number(this.sessionLength) : undefined
      };
      const result = await this.api.generatePlan(id, this.notes, options);
      this.generatedPlan.set(result);
    } catch (e) {
      console.error(e);
      // Fallback structured data for testing MVP UI
      this.generatedPlan.set({
        title: 'AI Generated Treatment Plan',
        summary: 'Fine motor strengthening plan based on therapist notes.',
        activities: [
          { title: 'Morning Grip Exercise', instructions: 'Pinch playdough or therapy putty for 5 minutes.', frequency: 'Daily', durationMinutes: 5, sortOrder: 0 },
          { title: 'Evening Stretching', instructions: 'Extend fingers fully and hold for 10 seconds. Repeat 10 times.', frequency: 'Daily', durationMinutes: 10, sortOrder: 1 }
        ]
      });
    } finally {
      this.isGenerating.set(false);
    }
  }

  async savePlan() {
    const id = this.route.snapshot.paramMap.get('id');
    const plan = this.generatedPlan();
    if (!id || !plan) return;

    this.isSaving.set(true);
    try {
      await this.api.saveClientPlan(id, plan);
      this.router.navigate(['/therapist/client', id]);
    } catch (e) {
      console.error('Failed to save treatment plan', e);
    } finally {
      this.isSaving.set(false);
    }
  }
}
