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

import {InstalledApp} from '../../../app/outline_server_repository/vpn';

@customElement('vpn-apps-dialog')
export class VpnAppsDialog extends LitElement {
  @property({type: Array}) apps: InstalledApp[] = [];
  @property({type: Function}) localize!: (...args: unknown[]) => string;
  @property({type: Boolean}) loading = false;
  @property({type: Boolean}) open = false;
  @property({type: Array}) selectedPackageNames: string[] = [];
  @property({type: String}) serverName = '';

  @state() private editedPackageNames: string[] = [];
  @state() private searchQuery = '';

  static styles = css`
    :host {
      --md-sys-color-primary: var(--outline-primary);
      --md-dialog-container-color: var(
        --outline-app-dialog-primary-background-color
      );
      --md-filled-text-field-container-color: var(--outline-input-bg);
      --md-filled-text-field-input-text-color: var(--outline-input-text);
      --md-dialog-container-shape: 20px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--outline-gutter);
    }

    .headline {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: var(--outline-gutter);
      width: min(72rem, 96vw);
      min-height: min(80vh, 56rem);
    }

    .app-list {
      border: 1px solid var(--outline-hairline);
      border-radius: var(--outline-corner);
      overflow: auto;
      min-height: 0;
    }

    .app-row {
      align-items: center;
      border-bottom: 1px solid var(--outline-hairline);
      column-gap: var(--outline-mini-gutter);
      cursor: pointer;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      padding: var(--outline-mini-gutter) var(--outline-gutter);
    }

    .app-row:last-child {
      border-bottom: none;
    }

    .app-name,
    .app-package {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .app-name {
      color: var(--outline-text-color);
      font-weight: 500;
    }

    .app-package {
      color: var(--outline-label-color);
      font-size: 0.875rem;
    }

    .empty-state,
    .loading-state {
      color: var(--outline-label-color);
      padding: var(--outline-large-gutter);
      text-align: center;
    }

    fieldset {
      border: none;
      text-transform: uppercase;
    }

    .lists {
      display: grid;
      gap: var(--outline-gutter);
      grid-template-columns: minmax(0, 1fr);
      min-height: 0;
    }

    .list-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 0;
    }

    .list-header {
      align-items: baseline;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .list-title {
      color: var(--outline-text-color);
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0;
    }

    .list-count {
      color: var(--outline-label-color);
      font-size: 0.8rem;
      margin: 0;
    }

    .helper {
      color: var(--outline-label-color);
      font-size: 0.8rem;
      margin: 0;
    }

    .help-text {
      line-height: 1.4;
      white-space: normal;
    }

    md-dialog {
      --md-dialog-container-height: min(92vh, 60rem);
      --md-dialog-container-width: min(96vw, 74rem);
    }

    md-icon-button {
      flex: 0 0 auto;
    }

    md-menu {
      --md-menu-container-color: var(
        --outline-app-dialog-primary-background-color
      );
      max-width: min(20rem, 80vw);
    }

    md-menu-item {
      --md-menu-item-label-text-color: var(--outline-text-color);
    }

    @media (min-width: 900px) {
      .lists {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      }
    }
  `;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (
      changedProperties.has('open') &&
      this.open &&
      !changedProperties.has('selectedPackageNames')
    ) {
      this.editedPackageNames = [...this.selectedPackageNames];
      this.searchQuery = '';
    }

    if (changedProperties.has('selectedPackageNames')) {
      this.editedPackageNames = [...this.selectedPackageNames];
    }
  }

  render() {
    return html`
      <md-dialog .open=${this.open} @close=${this.handleCancel} quick>
        <header slot="headline">
          <div class="headline">
            <span>${this.localize('vpn-apps-dialog-title')}</span>
            <md-icon-button
              id="vpnAppsHelpButton"
              aria-label=${this.localize('vpn-apps-dialog-help-label')}
              @click=${this.openHelpMenu}
            >
              <md-icon>help</md-icon>
            </md-icon-button>
            <md-menu
              id="vpnAppsHelpMenu"
              anchor="vpnAppsHelpButton"
              positioning="popover"
            >
              <md-menu-item type="button" disabled>
                <div class="help-text" slot="headline">
                  ${this.localize('vpn-apps-dialog-help-text')}
                </div>
              </md-menu-item>
            </md-menu>
          </div>
        </header>

        <div class="content" slot="content">
          <md-filled-text-field
            .value=${this.searchQuery}
            label=${this.localize('vpn-apps-dialog-search-label')}
            @input=${this.handleSearch}
          >
            <md-icon slot="leading-icon">search</md-icon>
          </md-filled-text-field>

          <div class="lists">
            <section class="list-block">
              <div class="list-header">
                <p class="list-title">
                  ${this.localize('vpn-apps-dialog-selected-title')}
                </p>
                <p class="list-count">
                  ${this.localize(
                    'vpn-apps-dialog-selected-count',
                    'count',
                    String(this.selectedApps.length)
                  )}
                </p>
              </div>
              <p class="helper">${this.localize('vpn-apps-dialog-selected-helper')}</p>
              <div class="app-list">
                ${this.loading
                  ? html`<div class="loading-state">
                      ${this.localize('vpn-apps-dialog-loading')}
                    </div>`
                  : this.selectedApps.length === 0
                    ? html`<div class="empty-state">
                        ${this.localize('vpn-apps-dialog-selected-empty')}
                      </div>`
                    : this.selectedApps.map(app => this.renderAppRow(app))}
              </div>
            </section>

            <section class="list-block">
              <div class="list-header">
                <p class="list-title">
                  ${this.localize('vpn-apps-dialog-available-title')}
                </p>
                <p class="list-count">
                  ${this.localize(
                    'vpn-apps-dialog-available-count',
                    'count',
                    String(this.availableApps.length)
                  )}
                </p>
              </div>
              <div class="app-list">
                ${this.loading
                  ? html`<div class="loading-state">
                      ${this.localize('vpn-apps-dialog-loading')}
                    </div>`
                  : this.availableApps.length === 0
                    ? html`<div class="empty-state">
                        ${this.localize('vpn-apps-dialog-empty')}
                      </div>`
                    : this.availableApps.map(app => this.renderAppRow(app))}
              </div>
            </section>
          </div>
        </div>

        <fieldset slot="actions">
          <md-text-button @click=${this.handleCancel}>
            ${this.localize('cancel')}
          </md-text-button>
          <md-filled-button @click=${this.handleConfirm}>
            ${this.localize('save')}
          </md-filled-button>
        </fieldset>
      </md-dialog>
    `;
  }

  private renderAppRow(app: InstalledApp) {
    const isSelected = this.editedPackageNames.includes(app.packageName);
    return html`
      <label class="app-row" for=${app.packageName}>
        <md-checkbox
          id=${app.packageName}
          ?checked=${isSelected}
          @change=${() => this.togglePackage(app.packageName)}
        ></md-checkbox>
        <div>
          <div class="app-name">${app.name}</div>
          <div class="app-package">${app.packageName}</div>
        </div>
      </label>
    `;
  }

  private get filteredApps(): InstalledApp[] {
    const normalizedQuery = this.searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.apps;
    }
    return this.apps.filter(
      app =>
        app.name.toLowerCase().includes(normalizedQuery) ||
        app.packageName.toLowerCase().includes(normalizedQuery)
    );
  }

  private get selectedApps(): InstalledApp[] {
    const selectedPackages = new Set(this.editedPackageNames);
    return this.filteredApps.filter(app => selectedPackages.has(app.packageName));
  }

  private get availableApps(): InstalledApp[] {
    const selectedPackages = new Set(this.editedPackageNames);
    return this.filteredApps.filter(
      app => !selectedPackages.has(app.packageName)
    );
  }

  private handleSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  private openHelpMenu() {
    const menu = this.shadowRoot?.getElementById(
      'vpnAppsHelpMenu'
    ) as unknown as ({open: boolean} | null);
    if (menu) {
      menu.open = true;
    }
  }

  private togglePackage(packageName: string) {
    const packageNames = new Set(this.editedPackageNames);
    if (packageNames.has(packageName)) {
      packageNames.delete(packageName);
    } else {
      packageNames.add(packageName);
    }
    this.editedPackageNames = Array.from(packageNames).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private handleCancel() {
    this.dispatchEvent(new CustomEvent('cancel'));
  }

  private handleConfirm() {
    this.dispatchEvent(
      new CustomEvent('confirm', {
        detail: {packageNames: this.editedPackageNames},
      })
    );
  }
}
