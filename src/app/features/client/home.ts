import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe } from '@angular/common';
import { ActivityCompletion } from '../../models';
import { calculateWeeklyCompletionRate } from './progress-metrics';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CardModule, ButtonModule, FormsModule, DatePipe],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
      
      <!-- Success Toast -->
      @if (successMessage()) {
        <div class="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 shadow-lg flex items-center gap-3 max-w-sm transition-all duration-300">
          <span class="text-green-600 flex items-center justify-center bg-green-100 rounded-full p-1 shrink-0">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <h4 class="font-bold text-sm">Activity Logged!</h4>
            <p class="text-xs text-green-700 mt-0.5">{{ successMessage() }}</p>
          </div>
        </div>
      }

      <p-card header="Today's Plan">
        @if (loading()) {
          <div class="flex items-center justify-center py-6">
            <svg class="animate-spin h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm text-gray-500">Loading plan...</p>
          </div>
        } @else if (plan()) {
          <div class="space-y-4">
            <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900">{{ plan()?.title }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ plan()?.summary }}</p>
              </div>
              <button (click)="startGuidedSession()"
                      class="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none grow-0 shrink-0">
                <i class="pi pi-play-circle text-lg"></i>
                Start Guided Session
              </button>
            </div>
            
            <div class="border-t pt-4">
              <h4 class="text-sm font-semibold text-gray-900 mb-2">Activities</h4>
              <ul class="space-y-3">
                @for (act of plan()?.activities; track act.id) {
                  <li class="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          @if (isCompleted(act.id)) {
                            <span class="text-green-600 flex items-center justify-center bg-green-50 rounded-full p-0.5 border border-green-200 shrink-0">
                              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          }
                          <span class="font-semibold text-gray-800 text-sm md:text-base" [class.line-through]="isCompleted(act.id)" [class.text-gray-400]="isCompleted(act.id)">
                            {{ act.title }}
                          </span>
                        </div>
                        <p class="text-xs text-gray-600 mt-1.5 whitespace-pre-line" [class.text-gray-400]="isCompleted(act.id)">
                          {{ act.instructions }}
                        </p>
                      </div>
                      <div class="flex flex-col items-end gap-2 shrink-0">
                        <span class="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {{ act.duration_minutes || act.durationMinutes }} mins • {{ act.frequency }}
                        </span>
                        @if (isCompleted(act.id)) {
                          <span class="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-bold select-none">
                            <svg class="h-3.5 w-3.5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Completed
                          </span>
                        } @else {
                          <button (click)="openCompleteModal(act)" class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer">
                            Complete Activity
                          </button>
                        }
                      </div>
                    </div>
                  </li>
                }
              </ul>
            </div>
          </div>
        } @else {
          <div class="text-center py-6 text-gray-500 bg-gray-50 rounded border border-dashed">
            <p class="text-sm">You have no active treatment plan. Talk to your therapist to set one up!</p>
          </div>
        }
      </p-card>

      <div class="flex flex-col gap-6">
        <p-card header="Progress">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-4xl font-bold text-primary-600">{{ weeklyCompletionRate }}%</div>
            <div class="text-gray-600">Weekly Goal Completion</div>
          </div>
          
          <div class="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
            <div class="bg-primary-600 h-3 rounded-full transition-all duration-500" [style.width.%]="weeklyCompletionRate"></div>
          </div>

          <div class="grid grid-cols-2 gap-4 border-t pt-4 text-sm text-gray-600 mb-2">
            <div>
              <span class="block text-xs font-semibold uppercase text-gray-400">Total Logged</span>
              <span class="font-bold text-lg text-gray-800">{{ completions().length }} completions</span>
            </div>
            <div>
              <span class="block text-xs font-semibold uppercase text-gray-400">Active Activities</span>
              <span class="font-bold text-lg text-gray-800">{{ plan()?.activities?.length || 0 }} tasks</span>
            </div>
          </div>
        </p-card>

        @if (getWeeklyGoals().length > 0) {
          <p-card header="Weekly Milestones">
            <div class="space-y-3">
              @for (goal of getWeeklyGoals(); track $index) {
                <div class="flex items-start gap-2.5">
                  <span class="text-primary-600 mt-0.5 shrink-0">
                    <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  <span class="text-sm font-semibold text-slate-700 leading-tight">{{ goal }}</span>
                </div>
              }
            </div>
          </p-card>
        }

        <p-card header="Completions History Log">
          @if (completions().length === 0) {
            <p class="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              No completion history logged yet. Run your exercises and mark them completed!
            </p>
          } @else {
            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
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

        <p-card header="Chat with Therapist">
          @if (plan()?.client_id) {
            <div class="flex flex-col h-[380px]">
              <!-- Scrollable messages container -->
              <div id="chat-scroll-container" class="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 max-h-[300px]">
                @if (loadingMessages()) {
                  <div class="flex items-center justify-center h-full py-12">
                    <svg class="animate-spin h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-sm text-gray-500">Loading conversation...</p>
                  </div>
                } @else if (messages().length === 0) {
                  <div class="flex flex-col items-center justify-center h-full text-center text-gray-500 py-12">
                    <svg class="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.655-.07.598.598 0 01-.165-.6c.021-.121.14-.87.49-1.566C3.07 17.301 2 14.776 2 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    <p class="text-sm font-medium">No messages yet.</p>
                    <p class="text-xs text-gray-400 mt-1">Send a message to your therapist below!</p>
                  </div>
                } @else {
                  <div class="space-y-4">
                    @for (msg of messages(); track msg.id) {
                      <div class="flex flex-col" [class.items-end]="isMyMessage(msg)">
                        <div class="flex items-center gap-1.5 mb-1 text-xs text-gray-400">
                          <span class="font-semibold text-gray-500" [class.text-primary-600]="isMyMessage(msg)">
                            {{ isMyMessage(msg) ? 'You' : 'Therapist' }}
                          </span>
                          <span>•</span>
                          <span>{{ msg.created_at | date:'shortTime' }}</span>
                        </div>
                        <div class="max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-xs break-words whitespace-pre-wrap"
                             [class]="isMyMessage(msg) 
                               ? 'bg-primary-600 text-white rounded-tr-none'
                               : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'">
                          {{ msg.body }}
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Message input -->
              <div class="mt-auto flex gap-2 border-t pt-4 shrink-0">
                <input 
                  type="text" 
                  [(ngModel)]="newMessageBody" 
                  (keyup.enter)="sendMessage()"
                  placeholder="Type a message..." 
                  class="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-800"
                  [disabled]="sendingMessage()"
                />
                <button 
                  (click)="sendMessage()" 
                  [disabled]="sendingMessage() || !newMessageBody.trim()"
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                  @if (sendingMessage()) {
                    <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  } @else {
                    <span>Send</span>
                  }
                </button>
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center h-[200px] text-center text-gray-500 py-6">
              <svg class="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.655-.07.598.598 0 01-.165-.6c.021-.121.14-.87.49-1.566C3.07 17.301 2 14.776 2 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p class="text-sm px-4">Chat with your therapist will be available once your treatment plan is created.</p>
            </div>
          }
        </p-card>
      </div>

      <!-- Tailwind Modal Overlay -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-lg font-bold text-gray-900">Mark Activity Completed</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Activity</label>
                <p class="text-sm font-semibold text-gray-800">{{ selectedActivity()?.title }}</p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">How much effort did this take? *</label>
                <div class="grid grid-cols-3 gap-3">
                  <button type="button" 
                          (click)="setEffort('easy')"
                          [class]="effort() === 'easy' 
                            ? 'py-2.5 px-3 rounded-lg border-2 border-green-500 bg-green-50 text-green-700 font-bold text-sm transition-all shadow-xs cursor-pointer'
                            : 'py-2.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm transition-all cursor-pointer'">
                    Easy
                  </button>
                  <button type="button" 
                          (click)="setEffort('medium')"
                          [class]="effort() === 'medium' 
                            ? 'py-2.5 px-3 rounded-lg border-2 border-amber-500 bg-amber-50 text-amber-700 font-bold text-sm transition-all shadow-xs cursor-pointer'
                            : 'py-2.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm transition-all cursor-pointer'">
                    Medium
                  </button>
                  <button type="button" 
                          (click)="setEffort('hard')"
                          [class]="effort() === 'hard' 
                            ? 'py-2.5 px-3 rounded-lg border-2 border-red-500 bg-red-50 text-red-700 font-bold text-sm transition-all shadow-xs cursor-pointer'
                            : 'py-2.5 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm transition-all cursor-pointer'">
                    Hard
                  </button>
                </div>
              </div>

              <div>
                <label for="completion-note" class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes (Optional)</label>
                <textarea id="completion-note" 
                          [(ngModel)]="note" 
                          rows="3" 
                          placeholder="How did it feel? Any specific challenges or breakthroughs?"
                          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white text-gray-800"></textarea>
              </div>
              
              @if (submitError()) {
                <div class="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200 flex gap-2">
                  <svg class="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{{ submitError() }}</span>
                </div>
              }
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button (click)="closeModal()" class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">
                Cancel
              </button>
              <button (click)="submitCompletion()" 
                      [disabled]="submitting() || !effort()"
                      class="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer">
                @if (submitting()) {
                  <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                } @else {
                  Log Completion
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Guided Session Overlay -->
      @if (sessionActive()) {
        <div class="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 md:p-12 text-white overflow-hidden animate-in fade-in duration-300">
          
          <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary-900/30 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl"></div>

          <!-- Header -->
          <div class="relative flex justify-between items-center z-10">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-primary-400">Guided Session</span>
              <h2 class="text-lg font-bold text-slate-100 mt-0.5">{{ plan()?.title }}</h2>
            </div>
            <button (click)="endGuidedSession()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer">
              Exit Session
            </button>
          </div>

          <!-- Main Content -->
          <div class="relative flex flex-col items-center justify-center text-center max-w-2xl mx-auto z-10">
            <div class="text-xs font-bold text-slate-400 mb-6 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              Exercise {{ sessionActivityIndex() + 1 }} of {{ plan()?.activities?.length }}
            </div>

            <h1 class="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
              {{ plan()?.activities[sessionActivityIndex()]?.title }}
            </h1>
            <p class="text-slate-400 text-sm md:text-base max-w-lg mb-8 leading-relaxed">
              {{ plan()?.activities[sessionActivityIndex()]?.instructions }}
            </p>

            <!-- Huge Timer Circle -->
            <div class="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center rounded-full bg-slate-900 border-4 border-slate-800 shadow-2xl">
              @if (!sessionTimerPaused()) {
                <div class="absolute inset-0 rounded-full border-4 border-primary-500 animate-ping opacity-15"></div>
              }
              
              <div class="flex flex-col items-center justify-center">
                <span class="text-6xl md:text-7xl font-mono font-extrabold tracking-tighter text-white">
                  {{ formatTime(sessionTimerSeconds()) }}
                </span>
                <span class="text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">
                  {{ sessionTimerPaused() ? 'Paused' : 'Remaining' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Controls -->
          <div class="relative flex justify-center items-center gap-6 z-10">
            <button (click)="pauseResumeTimer()" 
                    class="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 shadow-lg transition-all cursor-pointer">
              @if (sessionTimerPaused()) {
                <svg class="h-6 w-6 text-primary-400 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              } @else {
                <svg class="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6" />
                </svg>
              }
            </button>

            <button (click)="skipActivity()" 
                    class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5">
              <span>Skip Exercise</span>
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ClientHomeComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  
  plan = signal<any>(null);
  loading = signal(true);
  completions = signal<any[]>([]);
  private pollingInterval: any = null;

  // Guided Session State
  sessionActive = signal(false);
  sessionActivityIndex = signal(0);
  sessionTimerSeconds = signal(0);
  private sessionTimerInterval: any = null;
  sessionTimerPaused = signal(false);

  // Chat State
  messages = signal<any[]>([]);
  loadingMessages = signal(false);
  newMessageBody = '';
  sendingMessage = signal(false);

  // Modal State
  showModal = signal(false);
  selectedActivity = signal<any>(null);
  effort = signal<string>('');
  note = '';
  submitting = signal(false);
  submitError = signal<string>('');
  successMessage = signal<string>('');

  async ngOnInit() {
    try {
      const data = await this.api.getMyPlan();
      this.plan.set(data);
      if (data && data.client_id) {
        const comps = await this.api.getClientCompletions(data.client_id);
        this.completions.set(comps || []);
        await this.loadMessages(data.client_id);
        this.startPolling(data.client_id);
      }
    } catch (e) {
      console.error('Failed to load daily plan or completions', e);
    } finally {
      this.loading.set(false);
    }
  }

  async loadMessages(clientId: string) {
    this.loadingMessages.set(true);
    try {
      const msgs = await this.api.getClientMessages(clientId);
      this.messages.set(msgs || []);
      this.scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      this.loadingMessages.set(false);
    }
  }

  isMyMessage(msg: any): boolean {
    return msg.sender_user_id === this.auth.userProfile()?.id;
  }

  async sendMessage() {
    const body = this.newMessageBody.trim();
    const planData = this.plan();
    if (!body || !planData || !planData.client_id || this.sendingMessage()) return;

    this.sendingMessage.set(true);
    try {
      const res = await this.api.sendMessage(planData.client_id, body);
      if (res) {
        this.messages.update(prev => [...prev, res]);
        this.newMessageBody = '';
        this.scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      this.sendingMessage.set(false);
    }
  }

  startPolling(clientId: string) {
    this.stopPolling();
    this.pollingInterval = setInterval(async () => {
      try {
        const msgs = await this.api.getClientMessages(clientId);
        const currentMsgs = this.messages();
        if (!currentMsgs || currentMsgs.length !== msgs.length || (msgs.length > 0 && currentMsgs[currentMsgs.length - 1].id !== msgs[msgs.length - 1].id)) {
          this.messages.set(msgs || []);
          this.scrollToBottom();
        }
      } catch (err) {
        console.error('Failed to poll client messages', err);
      }

      try {
        const comps = await this.api.getClientCompletions(clientId);
        const currentComps = this.completions();
        if (!currentComps || currentComps.length !== comps.length) {
          this.completions.set(comps || []);
        }
      } catch (err) {
        console.error('Failed to poll client completions', err);
      }
    }, 5000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  getActivityTitle(activityId: string): string {
    const plan = this.plan();
    if (plan && plan.activities) {
      const act = plan.activities.find((a: any) => a.id === activityId);
      if (act) return act.title;
    }
    return 'Completed Activity';
  }

  get weeklyCompletionRate(): number {
    const plan = this.plan();
    if (!plan || !plan.activities || plan.activities.length === 0) return 0;
    return calculateWeeklyCompletionRate(plan.activities, this.completions());
  }

  scrollToBottom() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const container = document.getElementById('chat-scroll-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  }

  isCompleted(activityId: string): boolean {
    const localToday = new Date();
    const utcToday = new Date();
    
    const localDateStr = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;
    const utcDateStr = utcToday.toISOString().split('T')[0];

    return this.completions().some(comp => {
      if (comp.activity_id !== activityId) return false;
      if (!comp.completed_at) return false;
      const compDateStr = comp.completed_at.split(' ')[0].split('T')[0];
      return compDateStr === localDateStr || compDateStr === utcDateStr;
    });
  }

  openCompleteModal(activity: any) {
    this.selectedActivity.set(activity);
    this.effort.set('');
    this.note = '';
    this.submitError.set('');
    this.showModal.set(true);
  }

  setEffort(level: string) {
    this.effort.set(level);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedActivity.set(null);
    if (this.sessionActive()) {
      this.nextActivity();
    }
  }

  async submitCompletion() {
    const activity = this.selectedActivity();
    if (!activity || !this.effort()) return;

    this.submitting.set(true);
    this.submitError.set('');

    try {
      const result = await this.api.logActivityCompletion(activity.id, {
        effort: this.effort(),
        note: this.note ? this.note.trim() : undefined
      });

      // Update local completions state
      const completion = {
        ...result,
        activity_title: activity.title
      };
      this.completions.update(prev => [completion, ...prev]);

      // Show success toast
      this.successMessage.set(`Successfully logged completion for "${activity.title}"`);
      setTimeout(() => this.successMessage.set(''), 4000);

      const activeSession = this.sessionActive();
      this.showModal.set(false);
      this.selectedActivity.set(null);
      if (activeSession) {
        this.nextActivity();
      }
    } catch (err: any) {
      console.error('Failed to save activity completion', err);
      this.submitError.set('Failed to save completion. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  startGuidedSession() {
    const activeActivities = this.plan()?.activities || [];
    if (activeActivities.length === 0) return;
    
    this.sessionActive.set(true);
    this.sessionActivityIndex.set(0);
    this.sessionTimerPaused.set(false);
    this.initTimerForCurrentActivity();
  }

  initTimerForCurrentActivity() {
    this.stopTimerInterval();
    const activeActivities = this.plan()?.activities || [];
    const idx = this.sessionActivityIndex();
    if (idx >= activeActivities.length) {
      this.endGuidedSession();
      return;
    }
    const currentAct = activeActivities[idx];
    const duration = currentAct.duration_minutes || currentAct.durationMinutes || 0;
    this.sessionTimerSeconds.set(duration * 60);
    this.startTimerInterval();
  }

  startTimerInterval() {
    this.stopTimerInterval();
    this.sessionTimerInterval = setInterval(() => {
      if (!this.sessionTimerPaused()) {
        const remaining = this.sessionTimerSeconds();
        if (remaining > 0) {
          this.sessionTimerSeconds.set(remaining - 1);
        } else {
          this.handleActivityTimerComplete();
        }
      }
    }, 1000);
  }

  stopTimerInterval() {
    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval);
      this.sessionTimerInterval = null;
    }
  }

  pauseResumeTimer() {
    this.sessionTimerPaused.update(p => !p);
  }

  skipActivity() {
    this.nextActivity();
  }

  nextActivity() {
    const activeActivities = this.plan()?.activities || [];
    const nextIdx = this.sessionActivityIndex() + 1;
    if (nextIdx < activeActivities.length) {
      this.sessionActivityIndex.set(nextIdx);
      this.initTimerForCurrentActivity();
    } else {
      this.endGuidedSession();
    }
  }

  endGuidedSession() {
    this.stopTimerInterval();
    this.sessionActive.set(false);
  }

  playBeep() {
    if (typeof window !== 'undefined') {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.error('Failed to play completion sound:', e);
      }
    }
  }

  handleActivityTimerComplete() {
    this.stopTimerInterval();
    this.playBeep();
    
    const activeActivities = this.plan()?.activities || [];
    const idx = this.sessionActivityIndex();
    if (idx < activeActivities.length) {
      const currentAct = activeActivities[idx];
      this.openCompleteModal(currentAct);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getWeeklyGoals(): string[] {
    const goalsJson = this.plan()?.weekly_goals_json;
    if (!goalsJson) return [];
    try {
      const parsed = JSON.parse(goalsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
