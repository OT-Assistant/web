import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityCompletion, Client, Intake, Message } from '../../models';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CardModule, ButtonModule, FormsModule, DatePipe],
  template: `
    @if (client()) {
      <div class="max-w-4xl mx-auto py-6">
        <div class="mb-4">
          <button (click)="goBack()" class="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 text-sm font-medium cursor-pointer">
            &larr; Back to Client Directory
          </button>
        </div>
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-900">{{ client()?.display_name }}</h2>
          <div class="flex gap-2">
            <a [href]="'/therapist/client/' + client()?.id + '/plan'"><p-button label="Create AI Plan" icon="pi pi-sparkles"></p-button></a>
            <p-button label="Edit Details" severity="secondary" icon="pi pi-pencil" (onClick)="openEditModal()"></p-button>
            <p-button label="Delete Client" severity="danger" icon="pi pi-trash" (onClick)="confirmDelete()"></p-button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-1">
            <p-card header="Client Info">
              <div class="space-y-4">
                <div>
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="font-medium text-gray-900">{{ client()?.email || 'No email registered' }}</p>
                </div>
                
                <div>
                  <p class="text-sm text-gray-500">Status</p>
                  <p class="font-medium capitalize text-gray-900">{{ client()?.status }}</p>
                </div>

                <div>
                  <p class="text-sm text-gray-500">Notes</p>
                  <p class="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border border-gray-100">{{ client()?.notes || 'No notes added.' }}</p>
                </div>
              </div>
            </p-card>

            <p-card header="Activity Completions Log" styleClass="mt-6">
              @if (completions().length === 0) {
                <p class="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  No activities completed yet.
                </p>
              } @else {
                <div class="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  @for (comp of completions(); track comp.id) {
                    <div class="p-3 bg-gray-50 border border-gray-100 rounded-lg shadow-2xs">
                      <div class="flex justify-between items-start gap-2">
                        <div class="flex flex-col">
                          <span class="font-semibold text-sm text-gray-800">{{ getActivityTitle(comp.activity_id) }}</span>
                          <span class="text-[10px] text-gray-400 mt-0.5">{{ comp.completed_at | date:'MMM d, h:mm a' }}</span>
                        </div>
                        <span class="text-xs px-2 py-0.5 rounded-full font-bold capitalize select-none shrink-0"
                              [class.bg-green-100]="comp.effort === 'easy'"
                              [class.text-green-800]="comp.effort === 'easy'"
                              [class.bg-amber-100]="comp.effort === 'medium'"
                              [class.text-amber-800]="comp.effort === 'medium'"
                              [class.bg-red-100]="comp.effort === 'hard'"
                              [class.text-red-800]="comp.effort === 'hard'">
                          {{ comp.effort }}
                        </span>
                      </div>
                      @if (comp.note) {
                        <p class="text-xs text-gray-600 mt-2 bg-white p-2 rounded border border-gray-100 italic">
                          "{{ comp.note }}"
                        </p>
                      }
                    </div>
                  }
                </div>
              }
            </p-card>
          </div>
          
          <div class="md:col-span-2 flex flex-col gap-6">
            <!-- Intake Assessment Card -->
            <p-card header="Intake Assessment">
              @if (loadingIntake()) {
                <div class="flex items-center justify-center py-6">
                  <svg class="animate-spin h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p class="text-sm text-gray-500">Loading intake answers...</p>
                </div>
              } @else if (intake()) {
                <div class="space-y-4">
                  <div>
                    <h4 class="text-sm font-semibold text-gray-900 mb-1">Primary Goals</h4>
                    <p class="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border border-gray-100">
                      {{ getIntakeGoals(intake()) }}
                    </p>
                  </div>
                  <div>
                    <h4 class="text-sm font-semibold text-gray-900 mb-1">Daily Challenges</h4>
                    <p class="text-gray-700 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border border-gray-100">
                      {{ intake()?.daily_challenges || 'No daily challenges specified.' }}
                    </p>
                  </div>
                </div>
              } @else {
                <div class="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p class="text-sm">Client hasn't completed their intake form yet.</p>
                </div>
              }
            </p-card>

            <p-card>
              <ng-template pTemplate="title">
                <div class="flex justify-between items-center w-full">
                  <span class="text-xl font-bold text-gray-900">Active Treatment Plan</span>
                  @if (activePlan()) {
                    <div class="flex gap-2">
                      <p-button label="Edit Plan" icon="pi pi-pencil" severity="secondary" (onClick)="openEditPlanModal()" styleClass="p-button-sm"></p-button>
                      <p-button label="Delete Plan" icon="pi pi-trash" severity="danger" (onClick)="confirmDeletePlan()" styleClass="p-button-sm"></p-button>
                    </div>
                  }
                </div>
              </ng-template>
              @if (loadingPlan()) {
                <div class="flex items-center justify-center py-6">
                  <svg class="animate-spin h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p class="text-sm text-gray-500">Loading active plan...</p>
                </div>
              } @else if (activePlan()) {
                <div class="space-y-4">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">{{ activePlan()?.title }}</h3>
                    <p class="text-sm text-gray-600 mt-1">{{ activePlan()?.summary }}</p>
                  </div>
                  
                  <div class="border-t pt-4">
                    <h4 class="text-md font-medium text-gray-900 mb-2">Activities</h4>
                    <ul class="space-y-3">
                      @for (act of activePlan()?.activities; track act.id) {
                        <li class="bg-gray-50 p-3 rounded border border-gray-100">
                          <div class="flex justify-between items-start">
                            <span class="font-medium text-gray-800">{{ act.title }}</span>
                            <span class="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded font-semibold">
                              {{ act.duration_minutes || act.durationMinutes }} mins • {{ act.frequency }}
                            </span>
                          </div>
                          <p class="text-xs text-gray-600 mt-1 whitespace-pre-line">{{ act.instructions }}</p>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              } @else {
                <div class="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <i class="pi pi-folder-open text-4xl mb-4 text-gray-400"></i>
                  <p>No active plan found.</p>
                  <p class="text-sm mt-1">Click "Create AI Plan" to generate a personalized treatment plan.</p>
                </div>
              }
            </p-card>

            <p-card header="Messages & Chat">
              <div class="flex flex-col h-[400px]">
                <!-- Messages List -->
                <div id="chat-container" class="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                  @if (messages().length === 0) {
                    <div class="flex flex-col items-center justify-center h-full text-gray-500">
                      <i class="pi pi-comments text-4xl mb-2 text-gray-300"></i>
                      <p class="text-sm font-medium">No messages yet.</p>
                      <p class="text-xs text-gray-400">Send a message below to start the conversation.</p>
                    </div>
                  } @else {
                    @for (msg of messages(); track msg.id) {
                      <div class="flex flex-col" [class.items-end]="msg.sender_user_id !== client()?.client_user_id" [class.items-start]="msg.sender_user_id === client()?.client_user_id">
                        <!-- Sender Name & Timestamp -->
                        <div class="flex items-center gap-1.5 mb-1 text-xs text-gray-500">
                          <span class="font-semibold">
                            {{ msg.sender_user_id === client()?.client_user_id ? client()?.display_name : 'Therapist (You)' }}
                          </span>
                          <span>•</span>
                          <span>{{ msg.created_at | date:'MMM d, h:mm a' }}</span>
                        </div>
                        <!-- Bubble -->
                        <div class="max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-xs break-words whitespace-pre-wrap"
                             [class.bg-blue-600]="msg.sender_user_id !== client()?.client_user_id"
                             [class.text-white]="msg.sender_user_id !== client()?.client_user_id"
                             [class.rounded-br-none]="msg.sender_user_id !== client()?.client_user_id"
                             [class.bg-gray-100]="msg.sender_user_id === client()?.client_user_id"
                             [class.text-gray-800]="msg.sender_user_id === client()?.client_user_id"
                             [class.rounded-bl-none]="msg.sender_user_id === client()?.client_user_id">
                          {{ msg.body }}
                        </div>
                      </div>
                    }
                  }
                </div>

                <!-- Input area -->
                <form (submit)="sendMessage(); $event.preventDefault()" class="flex gap-2 border-t pt-4">
                  <input type="text"
                         [(ngModel)]="newMessageText"
                         name="newMessageText"
                         placeholder="Type a message..."
                         class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-800"
                         required />
                  <button type="submit"
                          [disabled]="!newMessageText.trim() || sendingMessage()"
                          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer">
                    @if (sendingMessage()) {
                      <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    } @else {
                      <span>Send</span>
                      <i class="pi pi-send text-xs"></i>
                    }
                  </button>
                </form>
              </div>
            </p-card>
          </div>
        </div>
      </div>

      <!-- Edit Client Modal -->
      @if (showEditModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" (click)="closeEditModal()"></div>

          <!-- Modal Content Container -->
          <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100 z-10">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 class="text-xl font-bold text-slate-900">Edit Client Details</h3>
              <button (click)="closeEditModal()" class="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form (submit)="submitEditForm(); $event.preventDefault()" class="p-6 space-y-4">
              @if (editError()) {
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm text-red-800 font-medium">
                        {{ editError() }}
                      </p>
                    </div>
                  </div>
                </div>
              }

              <div class="flex flex-col gap-1.5">
                <label for="editDisplayName" class="text-sm font-semibold text-slate-700">Display Name <span class="text-red-500">*</span></label>
                <input 
                  id="editDisplayName"
                  type="text" 
                  [(ngModel)]="editDisplayName" 
                  name="editDisplayName"
                  required
                  class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white"
                  placeholder="John Doe"
                  [disabled]="editSubmitting()"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="editEmail" class="text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  id="editEmail"
                  type="email" 
                  [(ngModel)]="editEmail" 
                  name="editEmail"
                  class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white"
                  placeholder="john.doe@example.com"
                  [disabled]="editSubmitting()"
                />
                <p class="text-xs text-slate-400">If the client logs in with this email, their account will link automatically.</p>
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="editNotes" class="text-sm font-semibold text-slate-700">Therapist Notes</label>
                <textarea 
                  id="editNotes"
                  [(ngModel)]="editNotes" 
                  name="editNotes"
                  rows="3"
                  class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white"
                  placeholder="Initial assessment details or special requirements..."
                  [disabled]="editSubmitting()"
                ></textarea>
              </div>

              <div class="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <p-button 
                  label="Cancel" 
                  severity="secondary" 
                  (onClick)="closeEditModal()" 
                  [disabled]="editSubmitting()"
                ></p-button>
                
                <button 
                  type="submit" 
                  [disabled]="editSubmitting() || !editDisplayName.trim()"
                  class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 cursor-pointer"
                >
                  @if (editSubmitting()) {
                    <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  } @else {
                    Save Changes
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Plan Modal -->
      @if (showEditPlanModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" (click)="closeEditPlanModal()"></div>

          <!-- Modal Content Container -->
          <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden transform transition-all duration-300 scale-100 z-10 flex flex-col max-h-[90vh]">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 class="text-xl font-bold text-slate-900">Edit Treatment Plan</h3>
              <button (click)="closeEditPlanModal()" class="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form (submit)="submitEditPlanForm(); $event.preventDefault()" class="flex-1 overflow-y-auto p-6 space-y-6">
              @if (editPlanError()) {
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm text-red-800 font-medium">
                        {{ editPlanError() }}
                      </p>
                    </div>
                  </div>
                </div>
              }

              <div class="flex flex-col gap-1.5">
                <label for="editPlanTitle" class="text-sm font-semibold text-slate-700">Plan Title <span class="text-red-500">*</span></label>
                <input 
                  id="editPlanTitle"
                  type="text" 
                  [(ngModel)]="editPlanTitle" 
                  name="editPlanTitle"
                  required
                  class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white"
                  placeholder="e.g. Fine Motor Skills Strengthening"
                  [disabled]="editPlanSubmitting()"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="editPlanSummary" class="text-sm font-semibold text-slate-700">Summary</label>
                <textarea 
                  id="editPlanSummary"
                  [(ngModel)]="editPlanSummary" 
                  name="editPlanSummary"
                  rows="3"
                  class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white"
                  placeholder="Provide a brief summary..."
                  [disabled]="editPlanSubmitting()"
                ></textarea>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-slate-700">Weekly Milestones (one per line)</label>
                <textarea 
                  [(ngModel)]="editPlanWeeklyGoals" 
                  name="editPlanWeeklyGoals"
                  rows="3"
                  class="w-full border-slate-200 rounded-xl shadow-sm border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white"
                  placeholder="e.g. Complete morning putty pinch 5 times&#10;Log medium effort twice"
                  [disabled]="editPlanSubmitting()"
                ></textarea>
              </div>

              <div class="border-t border-slate-100 pt-6">
                <div class="flex justify-between items-center mb-4">
                  <h4 class="text-md font-bold text-slate-800">Activities</h4>
                  <button 
                    type="button" 
                    (click)="addActivityToEditPlan()"
                    class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-semibold rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer"
                    [disabled]="editPlanSubmitting()"
                  >
                    <i class="pi pi-plus text-[10px]"></i> Add Activity
                  </button>
                </div>

                @if (editPlanActivities().length === 0) {
                  <div class="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                    No activities in this plan yet. Click "Add Activity" to create one.
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (act of editPlanActivities(); track $index) {
                      <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl relative flex flex-col gap-3">
                        <button 
                          type="button" 
                          (click)="removeActivityFromEditPlan($index)"
                          class="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="Remove activity"
                          [disabled]="editPlanSubmitting()"
                        >
                          <i class="pi pi-trash"></i>
                        </button>

                        <div class="flex flex-col gap-1 pr-6">
                          <label class="text-xs font-semibold text-slate-600">Activity Title</label>
                          <input 
                            type="text" 
                            [(ngModel)]="act.title" 
                            [name]="'actTitle_' + $index"
                            required
                            class="w-full border-slate-200 rounded-lg shadow-xs border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white text-sm"
                            placeholder="e.g. Pinching Putty"
                            [disabled]="editPlanSubmitting()"
                          />
                        </div>

                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-semibold text-slate-600">Instructions</label>
                          <textarea 
                            [(ngModel)]="act.instructions" 
                            [name]="'actInst_' + $index"
                            rows="2"
                            required
                            class="w-full border-slate-200 rounded-lg shadow-xs border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white text-sm"
                            placeholder="Instructions for the activity..."
                            [disabled]="editPlanSubmitting()"
                          ></textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                          <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-slate-600">Frequency</label>
                            <select 
                              [(ngModel)]="act.frequency" 
                              [name]="'actFreq_' + $index"
                              class="w-full border-slate-200 rounded-lg shadow-xs border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white text-sm"
                              [disabled]="editPlanSubmitting()"
                            >
                              <option value="Daily">Daily</option>
                              <option value="2x/day">2x/day</option>
                              <option value="3x/day">3x/day</option>
                              <option value="2x/week">2x/week</option>
                              <option value="3x/week">3x/week</option>
                              <option value="Weekly">Weekly</option>
                            </select>
                          </div>

                          <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-slate-600">Duration (minutes)</label>
                            <input 
                              type="number" 
                              [(ngModel)]="act.duration_minutes" 
                              [name]="'actDur_' + $index"
                              min="0"
                              required
                              class="w-full border-slate-200 rounded-lg shadow-xs border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white text-sm"
                              placeholder="10"
                              [disabled]="editPlanSubmitting()"
                            />
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </form>

            <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <p-button 
                label="Cancel" 
                severity="secondary" 
                (onClick)="closeEditPlanModal()" 
                [disabled]="editPlanSubmitting()"
              ></p-button>
              
              <button 
                type="submit" 
                (click)="submitEditPlanForm()"
                [disabled]="editPlanSubmitting() || !editPlanTitle.trim() || isEditPlanInvalid()"
                class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 cursor-pointer text-sm font-semibold"
              >
                @if (editPlanSubmitting()) {
                  <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Plan...
                } @else {
                  Save Plan
                }
              </button>
            </div>
          </div>
        </div>
      }
    }
  `
})
export class ClientDetailComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  goBack() {
    this.router.navigate(['/therapist']);
  }
  
  client = signal<Client | null>(null);
  intake = signal<Intake | null>(null);
  activePlan = signal<any>(null);
  loadingIntake = signal(true);
  loadingPlan = signal(true);

  messages = signal<Message[]>([]);
  newMessageText = '';
  sendingMessage = signal(false);

  completions = signal<ActivityCompletion[]>([]);
  private pollingInterval: any = null;

  showEditModal = signal(false);
  editDisplayName = '';
  editEmail = '';
  editNotes = '';
  editSubmitting = signal(false);
  editError = signal<string | null>(null);

  showEditPlanModal = signal(false);
  editPlanTitle = '';
  editPlanSummary = '';
  editPlanWeeklyGoals = '';
  editPlanActivities = signal<any[]>([]);
  editPlanSubmitting = signal(false);
  editPlanError = signal<string | null>(null);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const data = await this.api.getClient(id);
        this.client.set(data);
      } catch (e) {
        console.error('Failed to load client details', e);
      }

      try {
        const intakeData = await this.api.getClientIntake(id);
        this.intake.set(intakeData);
      } catch (e) {
        console.error('Failed to load client intake answers', e);
      } finally {
        this.loadingIntake.set(false);
      }

      try {
        const planData = await this.api.getClientPlan(id);
        this.activePlan.set(planData);
      } catch (e) {
        console.error('Failed to load active plan', e);
      } finally {
        this.loadingPlan.set(false);
      }

      try {
        const messageData = await this.api.getClientMessages(id);
        this.messages.set(messageData);
        this.scrollToBottom();
      } catch (e) {
        console.error('Failed to load client messages', e);
      }

      try {
        const completionData = await this.api.getClientCompletions(id);
        this.completions.set(completionData || []);
      } catch (e) {
        console.error('Failed to load client completions', e);
      }

      this.startPolling(id);
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  startPolling(clientId: string) {
    this.stopPolling();
    this.pollingInterval = setInterval(async () => {
      try {
        const messageData = await this.api.getClientMessages(clientId);
        const currentMsgs = this.messages();
        if (!currentMsgs || currentMsgs.length !== messageData.length || (messageData.length > 0 && currentMsgs[currentMsgs.length - 1].id !== messageData[messageData.length - 1].id)) {
          this.messages.set(messageData);
          this.scrollToBottom();
        }
      } catch (e) {
        console.error('Failed to poll client messages', e);
      }

      try {
        const comps = await this.api.getClientCompletions(clientId);
        const currentComps = this.completions();
        if (!currentComps || currentComps.length !== comps.length) {
          this.completions.set(comps || []);
        }
      } catch (e) {
        console.error('Failed to poll client completions', e);
      }
    }, 5000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  getActivityTitle(activityId: string): string {
    const plan = this.activePlan();
    if (plan && plan.activities) {
      const act = plan.activities.find((a: any) => a.id === activityId);
      if (act) return act.title;
    }
    return 'Completed Activity';
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  async sendMessage() {
    const text = this.newMessageText.trim();
    if (!text) return;

    const id = this.client()?.id;
    if (!id) return;

    this.sendingMessage.set(true);
    try {
      const newMsg = await this.api.sendMessage(id, text);
      this.messages.update(prev => [...prev, newMsg]);
      this.newMessageText = '';
      this.scrollToBottom();
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      this.sendingMessage.set(false);
    }
  }

  getIntakeGoals(intake: Intake | null): string {
    if (!intake || !intake.goals_json) return 'No goals specified.';
    try {
      const parsed = JSON.parse(intake.goals_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
      return intake.goals_json;
    } catch {
      return intake.goals_json;
    }
  }

  openEditModal() {
    const c = this.client();
    if (c) {
      this.editDisplayName = c.display_name;
      this.editEmail = c.email || '';
      this.editNotes = c.notes || '';
      this.editError.set(null);
      this.showEditModal.set(true);
    }
  }

  closeEditModal() {
    this.showEditModal.set(false);
  }

  async submitEditForm() {
    const id = this.client()?.id;
    if (!id) return;

    if (!this.editDisplayName.trim()) {
      this.editError.set('Display Name is required');
      return;
    }

    this.editSubmitting.set(true);
    this.editError.set(null);

    try {
      const updated = await this.api.updateClient(id, {
        display_name: this.editDisplayName.trim(),
        email: this.editEmail.trim() || undefined,
        notes: this.editNotes.trim() || undefined
      });
      this.client.set(updated);
      this.closeEditModal();
    } catch (e: any) {
      console.error('Failed to update client', e);
      this.editError.set(e.message || 'An error occurred while saving.');
    } finally {
      this.editSubmitting.set(false);
    }
  }

  async confirmDelete() {
    const id = this.client()?.id;
    if (!id) return;
    if (confirm('Are you sure you want to delete this client? This will permanently delete their profile and all associated data.')) {
      try {
        await this.api.deleteClient(id);
        this.router.navigate(['/therapist']);
      } catch (e) {
        console.error('Failed to delete client', e);
      }
    }
  }

  openEditPlanModal() {
    const plan = this.activePlan();
    if (plan) {
      this.editPlanTitle = plan.title;
      this.editPlanSummary = plan.summary || '';
      
      const weeklyGoals = plan.weekly_goals_json ? JSON.parse(plan.weekly_goals_json) : [];
      this.editPlanWeeklyGoals = Array.isArray(weeklyGoals) ? weeklyGoals.join('\n') : '';

      const clonedActivities = (plan.activities || []).map((act: any) => ({
        id: act.id,
        title: act.title || '',
        instructions: act.instructions || '',
        frequency: act.frequency || 'Daily',
        duration_minutes: act.duration_minutes !== undefined ? act.duration_minutes : (act.durationMinutes !== undefined ? act.durationMinutes : 0)
      }));
      this.editPlanActivities.set(clonedActivities);
      this.editPlanError.set(null);
      this.showEditPlanModal.set(true);
    }
  }

  closeEditPlanModal() {
    this.showEditPlanModal.set(false);
  }

  addActivityToEditPlan() {
    this.editPlanActivities.update(prev => [
      ...prev,
      {
        id: undefined,
        title: '',
        instructions: '',
        frequency: 'Daily',
        duration_minutes: 10
      }
    ]);
  }

  removeActivityFromEditPlan(index: number) {
    this.editPlanActivities.update(prev => prev.filter((_, i) => i !== index));
  }

  isEditPlanInvalid(): boolean {
    if (!this.editPlanTitle.trim()) return true;
    for (const act of this.editPlanActivities()) {
      if (!act.title?.trim()) return true;
      if (!act.instructions?.trim()) return true;
      if (act.duration_minutes === null || act.duration_minutes === undefined || act.duration_minutes < 0) return true;
    }
    return false;
  }

  async submitEditPlanForm() {
    const plan = this.activePlan();
    if (!plan) return;

    if (this.isEditPlanInvalid()) {
      this.editPlanError.set('Please fill out all required fields.');
      return;
    }

    this.editPlanSubmitting.set(true);
    this.editPlanError.set(null);

    try {
      const weeklyGoals = this.editPlanWeeklyGoals.split('\n').map(g => g.trim()).filter(Boolean);
      const updated = await this.api.updatePlan(plan.id, {
        title: this.editPlanTitle.trim(),
        summary: this.editPlanSummary.trim() || undefined,
        activities: this.editPlanActivities(),
        weekly_goals: weeklyGoals
      } as any);
      this.activePlan.set(updated);
      this.closeEditPlanModal();
    } catch (e: any) {
      console.error('Failed to update plan', e);
      this.editPlanError.set(e.message || 'An error occurred while saving the plan.');
    } finally {
      this.editPlanSubmitting.set(false);
    }
  }

  async confirmDeletePlan() {
    const plan = this.activePlan();
    if (!plan) return;

    if (confirm('Are you sure you want to delete this treatment plan? This will permanently delete the plan, its activities, and all associated completions.')) {
      try {
        await this.api.deletePlan(plan.id);
        this.activePlan.set(null);
      } catch (e) {
        console.error('Failed to delete treatment plan', e);
        alert('Failed to delete treatment plan');
      }
    }
  }
}
