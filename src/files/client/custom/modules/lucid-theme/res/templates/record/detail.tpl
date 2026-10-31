<div class="detail lucid-record" id="{{id}}" data-scope="{{scope}}" tabindex="-1">
    <div class="lucid-band">
        <div class="lucid-band-row">
            <div class="lucid-band-identity" data-role="lucid-identity"></div>
            {{#unless buttonsDisabled}}
            <div class="detail-button-container button-container record-buttons">
                <div class="sub-container clearfix">
                    <div
                        class="btn-group actions-btn-group"
                        role="group"
                    >{{{buttons}}}</div>
                    {{#if navigateButtonsEnabled}}
                        <div class="pull-right">
                            <div class="btn-group" role="group">
                                <button
                                    type="button"
                                    class="btn btn-text btn-icon action {{#unless previousButtonEnabled}} disabled{{/unless}}"
                                    data-action="previous"
                                    title="{{translate 'Previous Entry'}}"
                                    {{#unless previousButtonEnabled}}disabled="disabled"{{/unless}}
                                >
                                    <span class="fas fa-chevron-left"></span>
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-text btn-icon action {{#unless nextButtonEnabled}} disabled{{/unless}}"
                                    data-action="next"
                                    title="{{translate 'Next Entry'}}"
                                    {{#unless nextButtonEnabled}}disabled="disabled"{{/unless}}
                                >
                                    <span class="fas fa-chevron-right"></span>
                                </button>
                            </div>
                        </div>
                    {{/if}}
                </div>
            </div>
            <div class="detail-button-container button-container edit-buttons hidden">
                <div class="sub-container clearfix">
                    <div
                        class="btn-group actions-btn-group"
                        role="group"
                    >{{{editButtons}}}</div>
                    <div
                        class="btn-group pull-right"
                        role="group"
                    >{{{editSideButtons}}}</div>
                </div>
            </div>
            {{/unless}}
        </div>
        <div class="lucid-band-pipeline hidden" data-role="lucid-pipeline"></div>
    </div>

    <div class="record-grid lucid-record-grid{{#if isWide}} record-grid-wide{{/if}}{{#if isSmall}} record-grid-small{{/if}}">
        <aside class="left lucid-inspector" aria-label="{{translate 'About' category='labels' scope='Global'}}">
            <section class="lucid-inspector-card">
                <h2 class="lucid-inspector-title"><span class="lucid-plus" aria-hidden="true">+</span>{{translate 'About' category='labels' scope='Global'}}</h2>
                {{#if hasMiddleTabs}}
                <div class="tabs middle-tabs btn-group">
                    {{#each middleTabDataList}}
                    <button
                        class="btn btn-text btn-wide{{#if isActive}} active{{/if}}{{#if hidden}} hidden{{/if}}"
                        data-tab="{{@key}}"
                    >{{label}}</button>
                    {{/each}}
                </div>
                {{/if}}
                <div class="middle">{{{middle}}}</div>
            </section>
            <div class="side">
            {{{side}}}
            </div>
        </aside>
        <div
            class="lucid-resizer"
            role="separator"
            aria-orientation="vertical"
            tabindex="0"
            aria-label="{{translate 'width' category='wysiwygLabels' scope='Global'}} ({{translate 'About' category='labels' scope='Global'}})"
        ></div>
        <section class="lucid-main">
            <div class="extra">{{{extra}}}</div>
            <div class="bottom">{{{bottom}}}</div>
        </section>
    </div>
</div>
