/*
  Copyright 2026 The Outline Authors
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import '@material/web/all.js';

import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

import {
  MAX_ANDROID_VPN_MTU,
  MIN_ANDROID_VPN_MTU,
  normalizeAndroidVpnMtu,
} from '../../app/settings';

@customElement('mtu-view')
export class MtuView extends LitElement {
  @property({type: Function}) localize: (key: string) => string = msg => msg;
  @property({type: Number}) vpnMtu = normalizeAndroidVpnMtu(undefined);

  @state() private draftValue = String(this.vpnMtu);

  static styles = css`
    :host {
      background-color: var(--outline-background);
      color: var(--outline-text-color);
      display: block;
      height: 100%;
      width: 100%;
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 0 auto;
      max-width: 480px;
      padding: 24px 16px;
    }

    p {
      color: var(--outline-label-color);
      line-height: 1.5;
      margin: 0;
    }

    md-filled-text-field {
      --md-filled-text-field-container-color: var(--outline-card-background);
      --md-filled-text-field-input-text-color: var(--outline-text-color);
      --md-filled-text-field-label-text-color: var(--outline-label-color);
      --md-filled-text-field-supporting-text-color: var(--outline-label-color);
    }

    md-filled-button {
      align-self: flex-start;
    }
  `;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('vpnMtu')) {
      this.draftValue = String(this.vpnMtu);
    }
  }

  render() {
    return html`
      <div class="container">
        <p>${this.localize('mtu-description')}</p>
        <md-filled-text-field
          .value=${this.draftValue}
          label=${this.localize('mtu-input-label')}
          supporting-text=${this.isValid
            ? this.localize('mtu-helper-text')
            : this.localize('mtu-invalid')}
          ?error=${!this.isValid}
          inputmode="numeric"
          @input=${this.handleInput}
        ></md-filled-text-field>
        <md-filled-button
          ?disabled=${!this.isValid || !this.isDirty}
          @click=${this.save}
        >
          ${this.localize('save')}
        </md-filled-button>
      </div>
    `;
  }

  private get parsedValue(): number {
    return Number.parseInt(this.draftValue, 10);
  }

  private get isDirty(): boolean {
    return this.isValid && this.parsedValue !== this.vpnMtu;
  }

  private get isValid(): boolean {
    return (
      Number.isInteger(this.parsedValue) &&
      this.parsedValue >= MIN_ANDROID_VPN_MTU &&
      this.parsedValue <= MAX_ANDROID_VPN_MTU
    );
  }

  private handleInput(event: Event) {
    this.draftValue = (event.target as HTMLInputElement).value;
  }

  private save() {
    if (!this.isValid) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent('SetVpnMtuRequested', {
        bubbles: true,
        composed: true,
        detail: {mtu: this.parsedValue},
      })
    );
  }
}
