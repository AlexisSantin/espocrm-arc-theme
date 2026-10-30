<div class="detail arc-record" id="{{id}}" data-scope="{{scope}}" tabindex="-1">
    <div class="arc-band">
        <div class="arc-band-row">
            <div class="arc-band-identity" data-role="arc-identity"></div>
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
        <div class="arc-band-pipeline hidden" data-role="arc-pipeline"></div>
    </div>

    <div class="record-grid arc-record-grid{{#if isWide}} record-grid-wide{{/if}}{{#if isSmall}} record-grid-small{{/if}}">
        <aside class="left arc-inspector" aria-label="{{translate 'arcAbout' category='labels' scope='Global'}}">
            <section class="arc-inspector-card">
                <h2 class="arc-inspector-title"><span class="arc-plus" aria-hidden="true">+</span>{{translate 'arcAbout' category='labels' scope='Global'}}</h2>
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
            class="arc-resizer"
            role="separator"
            aria-orientation="vertical"
            tabindex="0"
            aria-label="{{translate 'arcResizeAbout' category='labels' scope='Global'}}"
            title="{{translate 'arcResizeHint' category='labels' scope='Global'}}"
        ><span class="arc-resizer-grip" aria-hidden="true"></span></div>
        <section class="arc-main">
            <div class="extra">{{{extra}}}</div>
            <div class="bottom">{{{bottom}}}</div>
        </section>
    </div>
</div>
