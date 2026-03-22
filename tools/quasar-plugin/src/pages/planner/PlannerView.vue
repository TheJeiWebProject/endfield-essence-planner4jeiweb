<template>
  <div class="planner-layout" :class="{ 'single-column': state.hideWeaponSelector }">
    <!-- Left Panel: Weapon Selector -->
    <div v-if="!state.hideWeaponSelector" class="panel-column">
      <q-card flat bordered class="panel-card main-panel">
        <q-card-section class="panel-header">
          <div class="row items-center justify-between no-wrap">
            <div class="text-h6">武器选择器</div>
            <q-btn
              class="plan-config-toggle"
              flat
              dense
              size="sm"
              :color="showPlanConfig ? 'primary' : 'grey-5'"
              :icon="showPlanConfig ? 'settings' : 'settings'"
              label="基质规划设置"
              @click="showPlanConfig = !showPlanConfig"
            />
          </div>
        </q-card-section>

        <q-slide-transition>
          <div v-if="showPlanConfig" ref="planConfigRoot" class="plan-config-panel q-px-md q-pb-md" @click.stop>
            <q-separator class="q-mb-md" />

            <!-- Marks Import/Export -->
            <div class="config-section">
              <button class="config-section-header" type="button" @click="togglePlanConfigSectionCollapsed('transfer')">
                <span>标记导入 / 导出</span>
                <q-icon :name="isPlanConfigSectionCollapsed('transfer') ? 'chevron_right' : 'expand_more'" />
              </button>
              <div v-show="!isPlanConfigSectionCollapsed('transfer')" class="q-mt-sm">
                <div class="row q-gutter-sm">
                  <q-btn dense unelevated color="grey-8" label="导出标记数据" @click="emit('export:weaponMarks')" />
                  <q-btn dense unelevated color="grey-8" label="导入标记数据" @click="triggerMarksImport" />
                  <input
                    ref="marksImportInput"
                    type="file"
                    accept="application/json,.json"
                    style="display:none"
                    @change="handleMarksImportFile"
                  />
                </div>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <!-- Display rules: hide 4-star -->
            <div class="config-section">
              <button class="config-section-header" type="button" @click="togglePlanConfigSectionCollapsed('displayRules')">
                <span>显示规则与优先级</span>
                <q-icon :name="isPlanConfigSectionCollapsed('displayRules') ? 'chevron_right' : 'expand_more'" />
              </button>
              <div v-show="!isPlanConfigSectionCollapsed('displayRules')" class="column q-gutter-sm q-mt-sm">
                <q-toggle
                  :model-value="props.state.recommendationConfig.hideFourStarWeaponsInSelector"
                  label="武器列表隐藏 4★ 武器"
                  dense
                  @update:model-value="setConfig({ hideFourStarWeaponsInSelector: $event })"
                />
                <q-toggle
                  :model-value="props.state.recommendationConfig.hideFourStarWeaponsInPlans"
                  label="方案推荐隐藏 4★ 武器"
                  dense
                  @update:model-value="setConfig({ hideFourStarWeaponsInPlans: $event })"
                />
                <q-toggle
                  :model-value="props.state.recommendationConfig.hideEssenceOwnedWeaponsInSelector"
                  label="武器列表隐藏已拥有基质武器"
                  dense
                  @update:model-value="setConfig({ hideEssenceOwnedWeaponsInSelector: $event })"
                />
                <q-toggle
                  :model-value="props.state.recommendationConfig.hideEssenceOwnedWeaponsInPlans"
                  label="方案推荐隐藏已拥有基质武器"
                  dense
                  @update:model-value="setConfig({ hideEssenceOwnedWeaponsInPlans: $event })"
                />
                <q-toggle
                  v-if="props.state.recommendationConfig.hideEssenceOwnedWeaponsInSelector || props.state.recommendationConfig.hideEssenceOwnedWeaponsInPlans"
                  :model-value="props.state.recommendationConfig.hideEssenceOwnedOwnedOnly"
                  label="仅当同时标记已拥有武器时隐藏"
                  dense
                  class="q-ml-md"
                  @update:model-value="setConfig({ hideEssenceOwnedOwnedOnly: $event })"
                />
                <q-toggle
                  :model-value="props.state.recommendationConfig.hideUnownedWeaponsInSelector"
                  label="武器列表隐藏未拥有武器"
                  dense
                  @update:model-value="setConfig({ hideUnownedWeaponsInSelector: $event })"
                />
                <q-toggle
                  :model-value="props.state.recommendationConfig.hideUnownedWeaponsInPlans"
                  label="方案推荐隐藏未拥有武器"
                  dense
                  @update:model-value="setConfig({ hideUnownedWeaponsInPlans: $event })"
                />
                <q-toggle
                  :model-value="props.state.recommendationConfig.showWeaponOwnership"
                  label="显示武器拥有标签"
                  dense
                  @update:model-value="setConfig({ showWeaponOwnership: $event })"
                />
                <q-toggle
                  :model-value="props.state.recommendationConfig.attributeFilterAffectsHiddenWeapons"
                  label="属性筛选同时作用于武器列表"
                  dense
                  @update:model-value="setConfig({ attributeFilterAffectsHiddenWeapons: $event })"
                />

                <div class="q-mt-sm">
                  <div class="text-caption text-grey-5 q-mb-xs">地区优先级</div>
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-md-6">
                      <q-select
                        dense
                        outlined
                        :model-value="props.state.recommendationConfig.preferredRegion1"
                        :options="['', ...regionOptions]"
                        label="优先地区 1"
                        @update:model-value="setConfig({ preferredRegion1: String($event || '') })"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <q-select
                        dense
                        outlined
                        :model-value="props.state.recommendationConfig.preferredRegion2"
                        :options="['', ...regionOptions].filter((r) => !r || r !== props.state.recommendationConfig.preferredRegion1)"
                        label="优先地区 2"
                        @update:model-value="setConfig({ preferredRegion2: String($event || '') })"
                      />
                    </div>
                  </div>
                </div>

                <q-select
                  dense
                  outlined
                  :model-value="props.state.recommendationConfig.regionPriorityMode"
                  :options="regionPriorityModeOptions"
                  emit-value
                  map-options
                  label="地区优先策略"
                  @update:model-value="setConfig({ regionPriorityMode: $event })"
                />
                <q-select
                  dense
                  outlined
                  :model-value="props.state.recommendationConfig.ownershipPriorityMode"
                  :options="ownershipPriorityModeOptions"
                  emit-value
                  map-options
                  label="拥有武器优先策略"
                  @update:model-value="setConfig({ ownershipPriorityMode: $event })"
                />
                <q-select
                  v-if="props.state.recommendationConfig.regionPriorityMode === 'strict' && props.state.recommendationConfig.ownershipPriorityMode === 'strict'"
                  dense
                  outlined
                  :model-value="props.state.recommendationConfig.strictPriorityOrder"
                  :options="strictPriorityOrderOptions"
                  emit-value
                  map-options
                  label="严格优先顺序"
                  @update:model-value="setConfig({ strictPriorityOrder: $event })"
                />

                <q-separator class="q-my-sm" />

                <div>
                  <div class="text-caption text-grey-5 q-mb-sm">自定义武器</div>
                  <div v-if="hasPreviewWeapons" class="text-caption text-warning q-mb-sm">
                    检测到词条预览数据，建议在管理器中检查
                    <q-btn
                      flat
                      dense
                      size="sm"
                      color="warning"
                      label="打开管理器"
                      @click="showWeaponAttrDataModal = true"
                    />
                  </div>
                  <div class="row q-col-gutter-sm q-mb-sm">
                    <div class="col-12 col-md-6">
                      <q-input v-model.trim="customWeaponDraft.name" dense outlined label="武器名称" />
                    </div>
                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="customWeaponDraft.rarity"
                        dense
                        outlined
                        :options="[6,5,4]"
                        label="星级"
                      />
                    </div>
                  </div>
                  <div class="row q-col-gutter-sm q-mb-sm">
                    <div class="col-12 col-md-4">
                      <q-select
                        v-model="customWeaponDraft.s1"
                        dense
                        outlined
                        :options="weaponAttrS1Options"
                        label="S1 基础属性"
                      />
                    </div>
                    <div class="col-12 col-md-4">
                      <q-select
                        v-model="customWeaponDraft.s2"
                        dense
                        outlined
                        :options="weaponAttrS2Options"
                        label="S2 附加属性"
                      />
                    </div>
                    <div class="col-12 col-md-4">
                      <q-select
                        v-model="customWeaponDraft.s3"
                        dense
                        outlined
                        :options="weaponAttrS3Options"
                        label="S3 技能属性"
                      />
                    </div>
                  </div>
                  <div v-if="customWeaponError" class="text-caption text-negative q-mb-sm">{{ customWeaponError }}</div>
                  <div class="row q-gutter-sm q-mb-sm">
                    <q-btn dense unelevated color="primary" label="添加自定义武器" @click="addCustomWeapon" />
                    <q-btn dense flat color="grey-5" label="清空" @click="resetCustomWeaponDraft" />
                  </div>

                  <q-list bordered separator v-if="customWeapons.length">
                    <q-item v-for="item in customWeapons" :key="'custom-' + item.name">
                      <q-item-section>
                        <q-item-label>{{ item.name }} · {{ item.rarity }}★</q-item-label>
                        <q-item-label caption>{{ item.s1 }} / {{ item.s2 }} / {{ item.s3 }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn flat dense color="negative" icon="delete" @click="removeCustomWeapon(item.name)" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </div>
          </div>
        </q-slide-transition>

        <q-card-section class="toolbar-section">
          <q-input
            v-model="weaponKeyword"
            dense
            outlined
            placeholder="🔍 搜索武器 / 属性 / 角色"
            class="search-input"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="filter-actions row q-gutter-sm q-mt-sm">
            <q-btn
              :color="showWeaponAttrs ? 'primary' : 'grey-8'"
              :outline="!showWeaponAttrs"
              label="显示属性/拥有/备注"
              @click="showWeaponAttrs = !showWeaponAttrs"
              class="col-grow"
            />
            <q-btn
              flat
              color="primary"
              :label="showFilterPanel ? '收起筛选' : '展开筛选'"
              @click="showFilterPanel = !showFilterPanel"
            />
            <q-btn
              flat
              color="secondary"
              label="清空筛选"
              :disable="!hasAttributeFilters"
              @click="clearPlannerFilters"
            />
          </div>
        </q-card-section>

        <q-slide-transition>
          <div v-if="showFilterPanel" class="filter-panel-content">
            <q-separator />
            <q-card-section>
              <div class="filter-group">
                <div class="text-caption q-mb-xs">基础属性</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="opt in plannerS1Options" :key="opt.value" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="plannerS1Filters.includes(opt.value) ? 'primary' : 'grey-9'"
                      :text-color="plannerS1Filters.includes(opt.value) ? 'white' : 'grey-4'"
                      :disable="opt.isDisabled && !plannerS1Filters.includes(opt.value)"
                      :label="opt.label"
                      @click="togglePlannerFilter('s1', opt.value)"
                    />
                  </div>
                </div>
              </div>
              <div class="filter-group q-mt-sm">
                <div class="text-caption q-mb-xs">附加属性</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="opt in plannerS2Options" :key="opt.value" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="plannerS2Filters.includes(opt.value) ? 'secondary' : 'grey-9'"
                      :text-color="plannerS2Filters.includes(opt.value) ? 'white' : 'grey-4'"
                      :disable="opt.isDisabled && !plannerS2Filters.includes(opt.value)"
                      :label="opt.label"
                      @click="togglePlannerFilter('s2', opt.value)"
                    />
                  </div>
                </div>
              </div>
              <div class="filter-group q-mt-sm">
                <div class="text-caption q-mb-xs">技能属性</div>
                <div class="row q-col-gutter-xs">
                  <div v-for="opt in plannerS3Options" :key="opt.value" class="col-auto">
                    <q-btn
                      dense
                      unelevated
                      size="sm"
                      :color="plannerS3Filters.includes(opt.value) ? 'accent' : 'grey-9'"
                      :text-color="plannerS3Filters.includes(opt.value) ? 'white' : 'grey-4'"
                      :disable="opt.isDisabled && !plannerS3Filters.includes(opt.value)"
                      :label="opt.label"
                      @click="togglePlannerFilter('s3', opt.value)"
                    />
                  </div>
                </div>
              </div>
            </q-card-section>
          </div>
        </q-slide-transition>

        <q-separator />

        <q-card-section class="selection-bar row items-center justify-between">
          <div class="selection-tags row q-gutter-xs">
            <span v-if="state.selectedWeapons.length === 0" class="text-grey-6 text-caption">未选择任何武器</span>
            <q-chip
              v-for="name in state.selectedWeapons"
              :key="name"
              removable
              dense
              square
              color="grey-9"
              text-color="white"
              @remove="toggleWeaponSelection(name)"
            >
              {{ name }}
              <q-badge v-if="ensureMark(name).ownedWeapon" color="primary" floating transparent rounded />
            </q-chip>
          </div>
          <div class="selection-actions row q-gutter-xs">
            <q-btn flat dense size="sm" color="primary" label="全选" @click="onSelectAllVisible" />
            <q-btn flat dense size="sm" color="negative" label="清空" @click="onSelectWeapons([])" />
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="weapon-list-container">
          <!-- Mode 1: Grid View (Images) -->
          <div v-if="!showWeaponAttrs" class="weapon-grid">
            <div
              v-for="item in weaponGalleryRows"
              :key="item.name"
              class="weapon-item"
              :class="{
                'is-selected': item.selected,
                'is-essence-owned': item.mark.ownedMatrix,
                'rarity-6': item.rarity === 6,
                'rarity-5': item.rarity === 5,
                'rarity-4': item.rarity === 4,
              }"
              @click="toggleWeaponSelection(item.name)"
            >
              <div class="weapon-art">
                <img
                  v-if="getWeaponImageUrl(item.name)"
                  :src="getWeaponImageUrl(item.name)"
                  loading="lazy"
                  class="weapon-figure"
                />
                <span v-else class="weapon-fallback-large">{{ item.rarity }}★</span>
              </div>
              <div class="weapon-band"></div>
              <div v-if="item.chars && item.chars.length" class="weapon-avatars">
                <img
                  v-for="(char, idx) in item.chars.slice(0, 3)"
                  :key="item.name + '-grid-char-' + idx"
                  :src="getCharacterImageUrl(char)"
                  class="weapon-avatar"
                  loading="lazy"
                />
              </div>
              <div class="weapon-corner-stack">
                <div v-if="item.isCustom" class="weapon-custom-chip">自定义</div>
                <div v-if="item.mark.excluded" class="weapon-hidden-chip">隐藏</div>
              </div>
              <div
                v-if="props.state.recommendationConfig.showWeaponOwnership"
                class="weapon-ownership-badge"
                :class="item.mark.ownedWeapon ? 'is-owned' : 'is-unowned'"
              >
                {{ item.mark.ownedWeapon ? '已拥有' : '未拥有' }}
              </div>
              <div class="weapon-name">
                <div class="weapon-title">
                  <span class="weapon-title-text">{{ item.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Mode 2: Attribute List View -->
          <div v-else class="weapon-attr-list">
            <div
              v-for="item in weaponGalleryRows"
              :key="item.name"
              class="weapon-attr-item"
              :class="[rarityClass(item.rarity), { 'is-selected': item.selected }]"
            >
              <div class="row items-start q-col-gutter-sm cursor-pointer" @click="toggleWeaponSelection(item.name)">
                <div class="col-auto">
                  <div class="weapon-thumb">
                    <img v-if="getWeaponImageUrl(item.name)" :src="getWeaponImageUrl(item.name)" />
                    <span v-else>{{ item.rarity }}★</span>
                  </div>
                </div>
                <div class="col">
                  <div class="row items-center q-gutter-x-sm">
                    <span v-if="item.chars && item.chars.length" class="weapon-avatar-strip inline">
                      <img
                        v-for="(char, idx) in item.chars.slice(0, 4)"
                        :key="item.name + '-list-char-' + idx"
                        :src="getCharacterImageUrl(char)"
                        class="weapon-char-avatar"
                        loading="lazy"
                      />
                    </span>
                    <span class="text-subtitle2">{{ item.name }}</span>
                    <q-badge v-if="item.short" color="secondary" outline>{{ item.short }}</q-badge>
                    <q-badge :color="item.selected ? 'primary' : 'grey-7'">{{ item.selected ? '已选' : '未选' }}</q-badge>
                    <q-badge
                      v-if="props.state.recommendationConfig.showWeaponOwnership && item.mark.ownedWeapon"
                      color="primary"
                      outline
                    >已拥有武器</q-badge>
                    <q-badge
                      v-if="props.state.recommendationConfig.showWeaponOwnership && item.mark.ownedMatrix"
                      color="teal"
                      outline
                    >已有基质</q-badge>
                  </div>
                  <div class="text-caption text-grey-4 q-mt-xs">
                    {{ item.type }} · <span :class="rarityClass(item.rarity)">{{ item.rarity }}★</span>
                  </div>
                  <div class="row q-gutter-x-md q-mt-xs text-caption">
                    <span :class="{ 'text-primary': plannerS1Filters.includes(item.s1 || '') }">基础: {{ item.s1 || '-' }}</span>
                    <span :class="{ 'text-secondary': plannerS2Filters.includes(item.s2 || '') }">附加: {{ item.s2 || '-' }}</span>
                    <span :class="{ 'text-accent': plannerS3Filters.includes(item.s3 || '') }">技能: {{ item.s3 || '-' }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Inline Actions Row -->
              <div class="row items-center q-gutter-sm q-mt-sm q-pa-sm rounded-borders planner-inline-tools">
                <q-btn
                  size="sm"
                  unelevated
                  :color="item.mark.ownedWeapon ? 'primary' : 'grey-8'"
                  :label="item.mark.ownedWeapon ? '标记未拥有' : '标记已拥有'"
                  @click.stop="setMarkField(item.name, 'ownedWeapon', !item.mark.ownedWeapon)"
                />
                <q-btn
                  size="sm"
                  unelevated
                  :color="item.mark.ownedMatrix ? 'teal' : 'grey-8'"
                  :label="item.mark.ownedMatrix ? '标记无基质' : '标记有基质'"
                  @click.stop="setMarkField(item.name, 'ownedMatrix', !item.mark.ownedMatrix)"
                />
                <q-input
                  :model-value="item.mark.note"
                  dense
                  borderless
                  placeholder="备注..."
                  class="col-grow text-caption note-input"
                  input-class="planner-note-input"
                  @click.stop
                  @update:model-value="setMarkNote(item.name, $event as string)"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Right Panel: Recommendations -->
    <div class="panel-column">
      <q-card flat bordered class="panel-card">
        <q-card-section class="panel-header row items-center justify-between">
          <div class="text-h6">方案推荐列表</div>
          <div class="row q-gutter-sm items-center">
            <q-chip dense color="secondary" text-color="white">
              已选 {{ effectiveSelectedWeaponNames.length }} / 待刷 {{ pendingCount }} 把
            </q-chip>
            <q-btn
              v-if="extraRecommendations.length"
              flat
              dense
              size="sm"
              color="primary"
              :label="showAllSchemes ? '收起其他方案' : `展开其他方案 (+${extraRecommendations.length})`"
              @click="showAllSchemes = !showAllSchemes"
            />
          </div>
        </q-card-section>

        <q-separator />

        <div class="recommendations-container q-pa-md">
          <q-banner
            v-if="recommendations.length > 0 && coverageSummary"
            rounded
            class="q-mb-md"
            :class="coverageSummary.hasGap ? 'bg-warning text-dark' : 'bg-positive text-white'"
          >
            <div class="text-subtitle2">
              覆盖进度：{{ coverageSummary.bestMatchCount }} / {{ coverageSummary.totalSelected }}
            </div>
            <div v-if="coverageSummary.hasGap" class="text-caption">
              未覆盖：{{ coverageSummary.missingNames.join('、') || '-' }}
            </div>
            <div v-else class="text-caption">当前主推荐已覆盖全部目标武器</div>
          </q-banner>

          <!-- Case 1: No Selection -->
          <div v-if="!state.selectedWeapons.length" class="empty-state text-center text-grey-6 q-py-xl">
            请选择至少一把武器，系统将自动推荐可共刷的副本方案。
          </div>

          <!-- Case 2: Filtered Out (Has selection but effective list is empty) -->
          <div v-else-if="!effectiveSelectedWeaponNames.length" class="empty-state text-center text-grey-6 q-py-xl">
            所有已选武器均被配置排除（已拥有或手动排除）。
          </div>

          <!-- Case 3: No Scheme Found (Conflict) -->
          <div v-else-if="!recommendations.length" class="conflict-state">
            <q-banner rounded class="conflict-banner q-mb-md">
              <template v-slot:avatar>
                <q-icon name="warning" color="warning" />
              </template>
              <div class="text-subtitle1">当前选择无可用共刷方案</div>
              <div class="text-caption text-grey-4">
                附加属性或技能属性无法统一，或无副本掉落该组合。
              </div>
            </q-banner>

            <div v-if="fallbackPlan" class="conflict-details">
              <div class="text-subtitle2 q-mb-sm">冲突分析</div>
              <div class="row q-gutter-sm q-mb-md">
                <q-chip
                  v-if="fallbackPlan.baseOverflow"
                  color="negative"
                  text-color="white"
                  icon="error"
                  label="基础属性冲突"
                />
                <q-chip
                  v-if="fallbackPlan.s2Conflict"
                  color="warning"
                  text-color="dark"
                  icon="warning"
                  label="附加属性不一致"
                />
                <q-chip
                  v-if="fallbackPlan.s3Conflict"
                  color="warning"
                  text-color="dark"
                  icon="warning"
                  label="技能属性不一致"
                />
              </div>

              <div class="conflict-weapon-list">
                <div
                  v-for="weapon in fallbackPlan.weaponRows"
                  :key="weapon.name"
                  class="weapon-attr-item"
                  :class="[rarityClass(weapon.rarity), { 'conflict-item': weapon.baseConflict }]"
                >
                   <div class="row items-center q-gutter-x-sm">
                      <span class="text-subtitle2">{{ weapon.name }}</span>
                      <div class="row q-gutter-x-sm text-caption">
                        <span :class="{ 'text-negative': weapon.baseConflict }">基础: {{ weapon.s1 }}</span>
                        <span :class="{ 'text-warning': fallbackPlan.s2Conflict }">附加: {{ weapon.s2 }}</span>
                        <span :class="{ 'text-warning': fallbackPlan.s3Conflict }">技能: {{ weapon.s3 }}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Case 4: Recommendations List -->
          <div v-else class="scheme-list q-gutter-y-md">
            <div
              v-if="coverageSummary && coverageSummary.hasGap"
              class="q-pa-sm rounded-borders q-mb-sm"
              style="background: var(--planner-surface-soft); border: 1px solid var(--planner-item-border);"
            >
              <div class="text-subtitle2">当前选择需要分批刷取</div>
              <div class="text-caption text-grey-5">
                本次展示 {{ displaySchemes.length }} 个方案，已尽量覆盖全部已选武器。
              </div>
            </div>

            <q-virtual-scroll
              :items="displaySchemes"
              :virtual-scroll-item-size="460"
              separator
              v-slot="{ item: scheme, index }"
            >
              <q-card
                :key="scheme.schemeKey"
                flat
                bordered
                class="scheme-card q-mb-md"
              >
              <div
                v-if="index === displayDividerIndex && showAllSchemes"
                class="text-center text-caption text-grey-5 q-py-sm"
              >
                ── 其他方案 ──
              </div>

              <q-card-section class="scheme-header planner-scheme-header">
                <div class="row items-center justify-between">
                  <div>
                    <div class="text-subtitle1">{{ scheme.dungeonName }}</div>
                    <div class="text-caption text-grey-4" v-if="scheme.displaySelectedMatchCount === scheme.targetCount">
                      额外词条池已满足当前全部已选武器
                    </div>
                    <div class="text-caption text-grey-4" v-else>
                      覆盖 {{ scheme.displaySelectedMatchCount }} / {{ scheme.targetCount }} 把已选武器
                    </div>
                    <div class="text-caption text-primary">
                      <q-icon name="lock" size="xs" /> 锁定{{ getLockLabel(scheme.lockType) }}：{{ scheme.lockValue }}
                    </div>
                  </div>
                  <div class="column items-end">
                    <q-chip color="primary" text-color="white" size="sm">
                      可同时刷 {{ scheme.displayWeaponCount }} 把（覆盖已选 {{ scheme.displaySelectedMatchCount }}）
                    </q-chip>
                    <q-chip v-if="scheme.activeCoveredWeapons.length !== scheme.coveredWeapons.length" color="grey-7" text-color="white" size="sm">
                      理论上限 {{ scheme.coveredWeapons.length }} 把
                    </q-chip>
                    <q-chip v-if="scheme.displaySelectedMissingNames.length && !scheme.baseOverflow" color="warning" text-color="dark" size="sm">
                      未覆盖 {{ scheme.displaySelectedMissingNames.length }} 把
                    </q-chip>
                    <q-chip v-if="scheme.baseOverflow" color="negative" text-color="white" size="sm" icon="warning">
                      基础冲突
                      <q-tooltip anchor="top middle" self="bottom middle" class="bg-negative text-white">
                        该方案基础词条超过 3 类，需要手动锁定 3 个基础词条后才是最终覆盖结果。
                      </q-tooltip>
                    </q-chip>
                  </div>
                </div>
              </q-card-section>
              
              <q-separator />

              <q-card-section v-if="scheme.baseOptions.length > 0" class="q-py-sm">
                <div class="text-caption q-mb-xs" :class="scheme.baseOverflow ? 'text-warning' : 'text-primary'">
                  <template v-if="scheme.baseOverflow">
                    基础词条超限：请手动锁定最多 3 个基础属性
                  </template>
                  <template v-else>
                    可手动锁定基础属性（最多 3 个），覆盖范围会实时更新。
                  </template>
                </div>
                <div class="row q-gutter-xs">
                  <q-chip
                    v-for="item in scheme.baseOptions"
                    :key="scheme.schemeKey + '-base-' + item.value"
                    dense
                    clickable
                    :color="item.selected ? 'primary' : 'grey-8'"
                    :text-color="item.selected ? 'white' : 'grey-3'"
                    @click="toggleSchemeBasePick(scheme.schemeKey, item.value)"
                  >
                    {{ item.value }} ×{{ item.count }}
                  </q-chip>
                </div>
                <div class="text-caption q-mt-xs" :class="scheme.manualPickOverflow ? 'text-negative' : 'text-grey-5'">
                  <template v-if="scheme.manualPickOverflow">
                    你选择的基础属性超过 3 个，请取消 {{ scheme.manualPickOverflowCount }} 个。
                  </template>
                  <template v-else-if="scheme.manualPickNeeded > 0">
                    还需选择 {{ scheme.manualPickNeeded }} 个基础属性。
                  </template>
                  <template v-else>
                    基础属性已锁定（{{ scheme.activeBasePick.length }} 项），可同时刷取范围已更新。
                  </template>
                </div>
              </q-card-section>

              <q-separator v-if="scheme.baseOptions.length > 0" />

              <q-card-section v-if="scheme.conflictSelected.length > 0" class="q-py-sm">
                <div class="row items-center justify-between">
                  <div class="text-caption text-warning">冲突武器：{{ scheme.conflictSelected.length }} 把</div>
                  <q-btn
                    flat
                    dense
                    size="sm"
                    color="warning"
                    :label="isConflictOpen(scheme.schemeKey) ? '收起冲突武器' : `展开冲突武器（${scheme.conflictSelected.length}）`"
                    @click="toggleConflictOpen(scheme.schemeKey)"
                  />
                </div>
                <div v-if="isConflictOpen(scheme.schemeKey)" class="q-mt-sm">
                  <div
                    v-for="weapon in scheme.conflictSelected"
                    :key="scheme.schemeKey + '-conflict-' + weapon.name"
                    class="q-pa-sm q-mb-xs rounded-borders"
                    style="border: 1px solid var(--planner-item-border); background: var(--planner-surface-soft);"
                  >
                    <div class="row items-center justify-between">
                      <div class="text-body2">{{ weapon.name }}</div>
                      <q-chip dense color="warning" text-color="dark">冲突</q-chip>
                    </div>
                    <div class="row q-gutter-x-sm text-caption text-grey-4">
                      <span>基础: {{ weapon.s1 }}</span>
                      <span>附加: {{ weapon.s2 }}</span>
                      <span>技能: {{ weapon.s3 }}</span>
                    </div>
                    <div class="text-caption text-warning q-mt-xs">原因：{{ weapon.reason }}</div>
                  </div>
                </div>
              </q-card-section>

              <q-separator v-if="scheme.conflictSelected.length > 0" />
              
              <div class="scheme-weapons">
                 <div
                  v-for="weapon in scheme.weaponRowsDisplay"
                  :key="scheme.schemeKey + '-row-' + weapon.name"
                  class="scheme-weapon-row q-pa-sm border-bottom cursor-pointer"
                    :class="{
                      'scheme-weapon-selected': weapon.isSelected,
                      'base-pick-mode': scheme.baseOverflow,
                      'is-dim': weapon.baseDim,
                    }"
                    @click="onSchemeWeaponClick(scheme.schemeKey, scheme.baseOverflow, weapon.name)"
                 >
                   <div class="row items-center q-col-gutter-sm">
                     <div class="col-auto">
                       <div class="weapon-thumb-mini">
                         <img v-if="getWeaponImageUrl(weapon.name)" :src="getWeaponImageUrl(weapon.name)" />
                         <span v-else>{{ weapon.rarity }}★</span>
                       </div>
                     </div>
                     <div class="col">
                       <div class="row items-center q-gutter-x-sm">
                         <span class="text-body2">{{ weapon.name }}</span>
                         <q-badge v-if="weapon.isCustom" color="deep-orange" outline size="sm">自定义</q-badge>
                         <q-badge v-if="weapon.short" color="secondary" outline size="sm">
                           {{ weapon.short }}
                         </q-badge>
                         <q-badge
                           v-if="props.state.recommendationConfig.showWeaponOwnership && weapon.isWeaponOwned"
                           color="primary"
                           outline
                           size="sm"
                         >已拥有武器</q-badge>
                         <q-badge
                           v-if="props.state.recommendationConfig.showWeaponOwnership && weapon.isEssenceOwned"
                           color="teal"
                           outline
                           size="sm"
                         >已有基质</q-badge>
                       </div>
                       <div class="row q-gutter-x-sm text-caption text-grey-4">
                         <span :class="{ 'text-negative': weapon.baseConflict }">
                           基础: {{ weapon.s1 }}
                           <q-tooltip v-if="weapon.baseConflict" anchor="top middle" self="bottom middle" class="bg-negative text-white">
                             基础冲突：当前方案锁定基础词条为 {{ scheme.activeBasePick.join(' / ') || '-' }}
                           </q-tooltip>
                         </span>
                         <span :class="{ 'text-accent': scheme.lockType === 's2' }">
                           附加: {{ weapon.s2 }}
                         </span>
                         <span :class="{ 'text-accent': scheme.lockType === 's3' }">
                           技能: {{ weapon.s3 }}
                         </span>
                       </div>
                       <div class="row items-center q-gutter-sm q-mt-xs" @click.stop>
                         <q-btn
                           size="xs"
                           dense
                           unelevated
                           :color="weapon.isWeaponOwned ? 'primary' : 'grey-8'"
                           :label="weapon.isWeaponOwned ? '已拥有' : '未拥有'"
                           @click.stop="setMarkField(weapon.name, 'ownedWeapon', !weapon.isWeaponOwned)"
                         />
                         <q-btn
                           size="xs"
                           dense
                           unelevated
                           :color="weapon.isEssenceOwned ? 'teal' : 'grey-8'"
                           :label="weapon.isEssenceOwned ? '有基质' : '无基质'"
                           @click.stop="setMarkField(weapon.name, 'ownedMatrix', !weapon.isEssenceOwned)"
                         />
                         <q-input
                           :model-value="ensureMark(weapon.name).note"
                           dense
                           borderless
                           class="col-grow text-caption note-input"
                           input-class="planner-note-input"
                           placeholder="备注..."
                           @update:model-value="setMarkNote(weapon.name, $event as string)"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
              </div>

              <q-card-section v-if="scheme.displaySelectedMissingNames.length > 0 && !scheme.baseOverflow" class="q-py-sm">
                <div class="text-caption text-warning q-mb-xs">未覆盖武器（基础词条限制）</div>
                <div class="row q-gutter-xs">
                  <q-chip
                    v-for="name in scheme.displaySelectedMissingNames"
                    :key="scheme.schemeKey + '-missing-' + name"
                    dense
                    outline
                    color="warning"
                    text-color="warning"
                    clickable
                    @click="toggleWeaponSelection(name)"
                  >
                    {{ name }}
                  </q-chip>
                </div>
              </q-card-section>
              </q-card>
            </q-virtual-scroll>
          </div>
        </div>
      </q-card>
    </div>
  </div>

  <q-dialog v-model="showWeaponAttrDataModal">
    <q-card style="min-width: 720px; max-width: 90vw;">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">词条预览数据管理</div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list bordered separator>
          <q-item v-for="row in previewWeaponRows" :key="'preview-' + row.name">
            <q-item-section>
              <q-item-label>{{ row.name }} · {{ row.rarity }}★</q-item-label>
              <q-item-label caption>S1 {{ row.s1 }} / S2 {{ row.s2 }} / S3 {{ row.s3 }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                v-if="row.isCustom"
                flat
                dense
                color="negative"
                icon="delete"
                @click="removeCustomWeapon(row.name)"
              />
              <q-badge v-else color="grey-7" label="基础数据" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { getDungeons, getWeaponImageId, getWeapons, toLegacyAssetUrl } from '@/core/data';
import { getRecommendations } from '@/core/recommender';
import type { PlannerState, RecommendationConfig, RecommendationResult, Weapon } from '@/core/types';
import { pinyin } from 'pinyin-pro';

const props = defineProps<{
  state: PlannerState;
  weaponMarks: Record<string, { ownedWeapon: boolean; ownedMatrix: boolean; excluded: boolean; note: string }>;
}>();

interface WeaponMark {
  ownedWeapon: boolean;
  ownedMatrix: boolean;
  excluded: boolean;
  note: string;
}

const emit = defineEmits<{
  (e: 'update:selectedWeapons', value: string[]): void;
  (e: 'update:weaponMark', name: string, partial: Partial<WeaponMark>): void;
  (e: 'update:recommendationConfig', partial: Partial<RecommendationConfig>): void;
  (e: 'export:weaponMarks'): void;
  (e: 'import:weaponMarks', raw: string): void;
}>();

const baseWeapons = getWeapons();
// weaponImageNameSet removed — use getWeaponImageId directly
const dungeons = getDungeons();
const regionOptions = [...new Set(dungeons.map((d) => d.name.split('·')[0]?.trim()).filter(Boolean))].sort((a, b) =>
  a.localeCompare(b, 'zh-Hans-CN'),
);
const regionPriorityModeOptions = [
  { label: '忽略地区优先级', value: 'ignore' },
  { label: '同覆盖率下按地区优先', value: 'sameCoverage' },
  { label: '同效率下按地区优先', value: 'sameEfficiency' },
  { label: '严格按地区优先', value: 'strict' },
];
const ownershipPriorityModeOptions = [
  { label: '忽略拥有状态', value: 'ignore' },
  { label: '同覆盖率下优先已拥有武器', value: 'sameCoverage' },
  { label: '同效率下优先已拥有武器', value: 'sameEfficiency' },
  { label: '严格按拥有状态优先', value: 'strict' },
];
const strictPriorityOrderOptions = [
  { label: '拥有优先 > 地区优先', value: 'ownershipFirst' },
  { label: '地区优先 > 拥有优先', value: 'regionFirst' },
];

const hideFourStar = computed({
  get: () => props.state.recommendationConfig.hideFourStarWeaponsInSelector,
  set: (v) => emit('update:recommendationConfig', { hideFourStarWeaponsInSelector: v }),
});
const hideExcluded = ref(false);
const showPlanConfig = ref(false);
const marksImportInput = ref<HTMLInputElement | null>(null);
const plannerS1Filters = ref<string[]>([]);
const plannerS2Filters = ref<string[]>([]);
const plannerS3Filters = ref<string[]>([]);
const weaponKeyword = ref('');
const showWeaponAttrs = ref(false);
const showFilterPanel = ref(true);
const showAllSchemes = ref(false);
const schemeBaseSelections = ref<Record<string, string[]>>({});
const conflictOpenMap = ref<Record<string, boolean>>({});
const planConfigRoot = ref<HTMLElement | null>(null);
const planConfigSectionCollapsed = ref<Record<string, boolean>>({});
const planConfigSectionManuallySet = ref(false);
const showWeaponAttrDataModal = ref(false);
const customWeapons = ref<Weapon[]>([]);
const customWeaponError = ref('');
const customWeaponDraft = reactive({
  name: '',
  rarity: 6,
  s1: '',
  s2: '',
  s3: '',
  type: '自定义武器',
});

const allWeapons = computed<Weapon[]>(() => [...baseWeapons, ...customWeapons.value]);

const weaponNameSet = computed(() => new Set(allWeapons.value.map((item) => item.name)));
const pinyinSearchCache = new Map<string, string>();

function getPinyinSearchText(raw: string): string {
  const text = String(raw || '').trim();
  if (!text) return '';
  const cached = pinyinSearchCache.get(text);
  if (cached) return cached;
  try {
    const arr = pinyin(text, { toneType: 'none', type: 'array' }) as string[];
    const full = arr.join('');
    const initials = arr.map((item) => (item && item[0] ? item[0] : '')).join('');
    const mixed = `${full} ${initials}`.toLowerCase();
    pinyinSearchCache.set(text, mixed);
    return mixed;
  } catch {
    pinyinSearchCache.set(text, '');
    return '';
  }
}

function ensureMark(name: string): WeaponMark {
  return props.weaponMarks[name] as WeaponMark || { ownedWeapon: false, ownedMatrix: false, excluded: false, note: '' };
}

function setMarkField(name: string, field: 'ownedWeapon' | 'ownedMatrix' | 'excluded', value: boolean) {
  emit('update:weaponMark', name, { [field]: value });
}

function setMarkNote(name: string, value: string) {
  emit('update:weaponMark', name, { note: value });
}

function normalizeSelectedWeapons(list: string[]): string[] {
  return [...new Set(list)].filter((name) => weaponNameSet.value.has(name));
}

const plannerS1Options = computed(() => {
  const pool = [...new Set(allWeapons.value.map((item) => item.s1).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return pool.map((value) => {
    const wouldMatch = allWeapons.value.some((w) => {
      if (w.s1 !== value) return false;
      if (plannerS2Filters.value.length && !plannerS2Filters.value.includes(w.s2 || '')) return false;
      if (plannerS3Filters.value.length && !plannerS3Filters.value.includes(w.s3 || '')) return false;
      if (hideFourStar.value && w.rarity <= 4) return false;
      return true;
    });
    return { label: value, value, isDisabled: !wouldMatch };
  });
});

const plannerS2Options = computed(() => {
  const pool = [...new Set(allWeapons.value.map((item) => item.s2).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return pool.map((value) => {
    const wouldMatch = allWeapons.value.some((w) => {
      if (w.s2 !== value) return false;
      if (plannerS1Filters.value.length && !plannerS1Filters.value.includes(w.s1 || '')) return false;
      if (plannerS3Filters.value.length && !plannerS3Filters.value.includes(w.s3 || '')) return false;
      if (hideFourStar.value && w.rarity <= 4) return false;
      return true;
    });
    return { label: value, value, isDisabled: !wouldMatch };
  });
});

const plannerS3Options = computed(() => {
  const pool = [...new Set(allWeapons.value.map((item) => item.s3).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return pool.map((value) => {
    const wouldMatch = allWeapons.value.some((w) => {
      if (w.s3 !== value) return false;
      if (plannerS1Filters.value.length && !plannerS1Filters.value.includes(w.s1 || '')) return false;
      if (plannerS2Filters.value.length && !plannerS2Filters.value.includes(w.s2 || '')) return false;
      if (hideFourStar.value && w.rarity <= 4) return false;
      return true;
    });
    return { label: value, value, isDisabled: !wouldMatch };
  });
});

const hasAttributeFilters = computed(() => {
  return plannerS1Filters.value.length > 0 || plannerS2Filters.value.length > 0 || plannerS3Filters.value.length > 0;
});

const weaponAttrS1Options = computed(() => {
  return [...new Set(baseWeapons.map((item) => item.s1).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN'),
  );
});

const weaponAttrS2Options = computed(() => {
  return [...new Set(baseWeapons.map((item) => item.s2).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN'),
  );
});

const weaponAttrS3Options = computed(() => {
  return [...new Set(baseWeapons.map((item) => item.s3).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN'),
  );
});

const hasPreviewWeapons = computed(() => {
  return allWeapons.value.some((weapon) => weapon.isPreview || !weapon.s1 || !weapon.s2 || !weapon.s3);
});

const previewWeaponRows = computed(() => {
  return allWeapons.value
    .filter((weapon) => weapon.isPreview || !weapon.s1 || !weapon.s2 || !weapon.s3)
    .map((weapon) => ({
      name: weapon.name,
      rarity: weapon.rarity,
      s1: weapon.s1 || '-',
      s2: weapon.s2 || '-',
      s3: weapon.s3 || '-',
      isCustom: customWeapons.value.some((item) => item.name === weapon.name),
    }));
});

const filteredWeapons = computed(() => {
  const cfg = props.state.recommendationConfig;
  const keyword = weaponKeyword.value.trim().toLowerCase();
  return allWeapons.value.filter((weapon) => {
    const mark = ensureMark(weapon.name);
    if (hideFourStar.value && weapon.rarity <= 4) {
      return false;
    }
    if (hideExcluded.value && mark.excluded) {
      return false;
    }
    if (cfg.hideEssenceOwnedWeaponsInSelector && mark.ownedMatrix) {
      if (!cfg.hideEssenceOwnedOwnedOnly || mark.ownedWeapon) return false;
    }
    if (cfg.hideUnownedWeaponsInSelector && !mark.ownedWeapon) {
      return false;
    }
    if (plannerS1Filters.value.length > 0 && !plannerS1Filters.value.includes(weapon.s1 || '')) {
      return false;
    }
    if (plannerS2Filters.value.length > 0 && !plannerS2Filters.value.includes(weapon.s2 || '')) {
      return false;
    }
    if (plannerS3Filters.value.length > 0 && !plannerS3Filters.value.includes(weapon.s3 || '')) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    const rawText = `${weapon.name} ${weapon.short || ''} ${weapon.type} ${weapon.chars?.join(' ') || ''} ${weapon.s1 || ''} ${weapon.s2 || ''} ${weapon.s3 || ''}`;
    const text = rawText.toLowerCase();
    if (text.includes(keyword)) return true;
    return getPinyinSearchText(rawText).includes(keyword);
  });
});

const weaponGalleryRows = computed(() => {
  return filteredWeapons.value.map((item) => ({
    ...item,
    isCustom: Boolean((item as { isCustom?: boolean }).isCustom),
    selected: props.state.selectedWeapons.includes(item.name),
    mark: ensureMark(item.name),
  }));
});

const selectedMarkRows = computed(() => {
  const selectedSet = new Set(props.state.selectedWeapons);
  return allWeapons.value
    .filter((item) => selectedSet.has(item.name))
    .map((item) => ({
      name: item.name,
      type: item.type,
      rarity: item.rarity,
    }));
});

const effectiveSelectedWeaponNames = computed(() => {
  const cfg = props.state.recommendationConfig;
  return props.state.selectedWeapons.filter((name) => {
    const mark = ensureMark(name);
    if (mark.excluded) return false;
    if (cfg.hideEssenceOwnedWeaponsInPlans && mark.ownedMatrix) {
      if (!cfg.hideEssenceOwnedOwnedOnly || mark.ownedWeapon) return false;
    }
    if (cfg.hideUnownedWeaponsInPlans && !mark.ownedWeapon) return false;
    if (cfg.hideFourStarWeaponsInPlans) {
      const w = allWeapons.value.find((x) => x.name === name);
      if (w && w.rarity <= 4) return false;
    }
    return true;
  });
});

const recommendations = computed<RecommendationResult[]>(() => {
  return getRecommendations(effectiveSelectedWeaponNames.value, allWeapons.value, dungeons, {
    config: props.state.recommendationConfig,
    isWeaponOwned: (name) => ensureMark(name).ownedWeapon,
    isMatrixOwned: (name) => ensureMark(name).ownedMatrix,
  });
});

const pendingCount = computed(() => {
  return props.state.selectedWeapons.filter((name) => {
    const mark = ensureMark(name);
    return !mark.ownedMatrix;
  }).length;
});

const primaryRecommendations = computed(() => {
  const schemes = recommendations.value;
  if (!schemes.length) return [];

  const top = schemes[0];
  const targetNames = effectiveSelectedWeaponNames.value;
  if (!targetNames.length) return schemes.slice(0, 1);

  const bestMatch = top.selectedMatchCount ?? top.score;
  const bestWeaponCount = top.weaponCount ?? top.coveredWeapons.length;
  const bestSchemes = schemes.filter(
    (scheme) =>
      (scheme.selectedMatchCount ?? scheme.score) === bestMatch &&
      (scheme.weaponCount ?? scheme.coveredWeapons.length) === bestWeaponCount,
  );

  const remaining = new Set(targetNames);
  const picked: RecommendationResult[] = [];
  const pickedKeys = new Set<string>();

  const pickScheme = (scheme: RecommendationResult) => {
    picked.push(scheme);
    pickedKeys.add(scheme.schemeKey);
    const names = scheme.selectedMatchNames || scheme.coveredWeapons;
    names.forEach((name) => remaining.delete(name));
  };

  let seed: RecommendationResult | null = null;
  let seedCover = -1;
  bestSchemes.forEach((scheme) => {
    const names = scheme.selectedMatchNames || scheme.coveredWeapons;
    const cover = names.length;
    if (cover > seedCover) {
      seed = scheme;
      seedCover = cover;
    }
  });
  if (seed) pickScheme(seed);

  while (remaining.size) {
    let best: RecommendationResult | null = null;
    let bestCover = 0;

    schemes.forEach((scheme) => {
      if (pickedKeys.has(scheme.schemeKey)) return;
      const names = scheme.selectedMatchNames || scheme.coveredWeapons;
      const cover = names.filter((name) => remaining.has(name)).length;
      if (cover > bestCover) {
        best = scheme;
        bestCover = cover;
      }
    });

    if (!best || bestCover === 0) break;
    pickScheme(best);
  }

  bestSchemes.forEach((scheme) => {
    if (!pickedKeys.has(scheme.schemeKey)) pickScheme(scheme);
  });

  if (!picked.length && schemes.length) {
    pickScheme(schemes[0]);
  }

  return picked;
});

const extraRecommendations = computed(() => {
  const primaryKeys = new Set(primaryRecommendations.value.map((item) => item.schemeKey));
  return recommendations.value.filter((item) => !primaryKeys.has(item.schemeKey));
});

const displayRecommendations = computed(() => {
  return showAllSchemes.value ? recommendations.value : primaryRecommendations.value;
});

const displayDividerIndex = computed(() => {
  if (!showAllSchemes.value) return -1;
  return primaryRecommendations.value.length;
});

const coverageSummary = computed(() => {
  if (!recommendations.value.length) return null;
  const first = recommendations.value[0];
  if (!first) return null;
  const totalSelected = effectiveSelectedWeaponNames.value.length;
  const bestMatchCount = first.selectedMatchCount ?? first.score;
  const missingNames = first.selectedMissingNames || [];
  return {
    totalSelected,
    bestMatchCount,
    missingNames,
    hasGap: bestMatchCount < totalSelected,
  };
});

const displaySchemes = computed(() => {
  return displayRecommendations.value.map((scheme) => {
    const weaponRows = Array.isArray(scheme.weaponRows) ? scheme.weaponRows : [];
    const targetCount = Number.isFinite(scheme.targetCount) ? scheme.targetCount || 0 : effectiveSelectedWeaponNames.value.length;
    const conflictSelected = (scheme.conflictDetails || []).filter((item) =>
      effectiveSelectedWeaponNames.value.includes(item.name),
    );

    const baseAutoPick = Array.isArray(scheme.baseAutoPickKeys) && scheme.baseAutoPickKeys.length
      ? scheme.baseAutoPickKeys
      : scheme.basePick;

    const baseCounts: Record<string, number> = {};
    weaponRows.forEach((weapon) => {
      const s1 = weapon.s1 || '';
      if (!s1) return;
      baseCounts[s1] = (baseCounts[s1] || 0) + 1;
    });
    const baseOptionsRaw = Object.keys(baseCounts).sort((a, b) => {
      if (baseCounts[b] !== baseCounts[a]) return baseCounts[b] - baseCounts[a];
      return a.localeCompare(b, 'zh-Hans-CN');
    });
    const hasStored = Object.prototype.hasOwnProperty.call(schemeBaseSelections.value, scheme.schemeKey);
    const storedManual = hasStored ? schemeBaseSelections.value[scheme.schemeKey] || [] : [];
    const manualSeed = hasStored ? storedManual : baseAutoPick;
    const manualPick = manualSeed.filter((item) => baseOptionsRaw.includes(item));
    const baseLimit = 3;
    const manualPickNeeded = scheme.baseOverflow ? Math.max(0, baseLimit - manualPick.length) : 0;
    const manualPickOverflow = manualPick.length > baseLimit;
    const manualPickOverflowCount = manualPickOverflow ? manualPick.length - baseLimit : 0;
    const manualPickReady = scheme.baseOverflow
      ? manualPick.length >= baseLimit && !manualPickOverflow
      : true;
    const activeBasePick = scheme.baseOverflow
      ? manualPickReady
        ? manualPick.slice(0, baseLimit)
        : baseAutoPick
      : manualPick.length
        ? manualPick.slice(0, baseLimit)
        : baseOptionsRaw.slice(0, baseLimit);
    const activeBaseSet = new Set(activeBasePick);
    const selectedCoveredNames = new Set(
      weaponRows
        .filter((weapon) => weapon.isSelected && activeBaseSet.has(weapon.s1 || ''))
        .map((weapon) => weapon.name),
    );
    const displaySelectedMissingNames = effectiveSelectedWeaponNames.value.filter(
      (name) => !selectedCoveredNames.has(name),
    );
    const displaySelectedMatchCount = effectiveSelectedWeaponNames.value.length - displaySelectedMissingNames.length;
    const activeCoveredWeapons = weaponRows
      .filter((weapon) => activeBaseSet.has(weapon.s1 || ''))
      .map((weapon) => weapon.name);

    const weaponRowsDisplay = weaponRows.map((weapon) => {
      const baseAllowed = activeBaseSet.has(weapon.s1 || '');
      const baseConflict = Boolean(scheme.baseOverflow) && manualPickReady && !baseAllowed;
      const baseDim = baseConflict || weapon.isEssenceOwned;
      return {
        ...weapon,
        baseConflict,
        baseDim,
        baseLocked: baseAllowed,
      };
    });

    const baseOptions = baseOptionsRaw.map((value) => ({
      value,
      count: baseCounts[value],
      selected: manualPick.includes(value),
    }));

    return {
      ...scheme,
      activeBasePick,
      activeCoveredWeapons,
      activeMissingWeapons: displaySelectedMissingNames,
      displayWeaponCount: activeCoveredWeapons.length,
      displaySelectedMatchCount,
      displaySelectedMissingNames,
      targetCount,
      manualPickNeeded,
      manualPickOverflow,
      manualPickOverflowCount,
      conflictSelected,
      baseOptions,
      weaponRowsDisplay,
    };
  });
});

const fallbackPlan = computed(() => {
  if (recommendations.value.length > 0) return null;
  if (props.state.selectedWeapons.length === 0) return null;

  const targets = allWeapons.value.filter((w) => props.state.selectedWeapons.includes(w.name));
  
  const baseCounts: Record<string, number> = {};
  targets.forEach((w) => {
    baseCounts[w.s1 || ''] = (baseCounts[w.s1 || ''] || 0) + 1;
  });
  const baseKeys = Object.keys(baseCounts).sort((a, b) => baseCounts[b] - baseCounts[a]);
  const baseOverflow = baseKeys.length > 3;
  const basePick = baseKeys.slice(0, 3);

  const s2Set = new Set(targets.map((w) => w.s2).filter(Boolean));
  const s3Set = new Set(targets.map((w) => w.s3).filter(Boolean));
  const s2Conflict = s2Set.size > 1;
  const s3Conflict = s3Set.size > 1;

  const weaponRows = targets.map((weapon) => ({
    ...weapon,
    baseConflict: baseOverflow && !basePick.includes(weapon.s1 || ''),
  }));

  return {
    baseOverflow,
    s2Conflict,
    s3Conflict,
    weaponRows,
  };
});

function togglePlannerFilter(target: 's1' | 's2' | 's3', value: string) {
  const list = target === 's1' ? plannerS1Filters.value : target === 's2' ? plannerS2Filters.value : plannerS3Filters.value;
  const index = list.indexOf(value);
  if (index >= 0) {
    list.splice(index, 1);
    return;
  }
  list.push(value);
}

function clearPlannerFilters() {
  plannerS1Filters.value = [];
  plannerS2Filters.value = [];
  plannerS3Filters.value = [];
}

function getWeaponImageUrl(name: string): string {
  const id = getWeaponImageId(name);
  return id ? toLegacyAssetUrl(`legacy/image/weapon/${encodeURIComponent(id)}.avif`) : '';
}

function getCharacterImageUrl(name: string): string {
  return toLegacyAssetUrl(`legacy/image/characters/${encodeURIComponent(name)}.avif`);
}

function rarityClass(rarity: number): string {
  if (rarity >= 6) return 'rarity-6';
  if (rarity >= 5) return 'rarity-5';
  return 'rarity-4';
}

function toggleWeaponSelection(name: string) {
  if (props.state.readonly) {
    return;
  }
  if (props.state.selectedWeapons.includes(name)) {
    emit('update:selectedWeapons', props.state.selectedWeapons.filter((item) => item !== name));
  } else {
    emit('update:selectedWeapons', normalizeSelectedWeapons([...props.state.selectedWeapons, name]));
  }
}

function onSelectAllVisible() {
  if (props.state.readonly) {
    return;
  }
  const visible = filteredWeapons.value.map((item) => item.name);
  emit('update:selectedWeapons', normalizeSelectedWeapons(visible));
}

function onSelectWeapons(value: string[]) {
  if (props.state.readonly) {
    return;
  }
  emit('update:selectedWeapons', normalizeSelectedWeapons(value));
}

function getWeapon(name: string): Weapon | undefined {
  return allWeapons.value.find((w) => w.name === name);
}

function getLockLabel(type: 's2' | 's3'): string {
  return type === 's2' ? '附加属性' : '技能属性';
}

function resetCustomWeaponDraft() {
  customWeaponDraft.name = '';
  customWeaponDraft.rarity = 6;
  customWeaponDraft.s1 = '';
  customWeaponDraft.s2 = '';
  customWeaponDraft.s3 = '';
  customWeaponError.value = '';
}

function addCustomWeapon() {
  const name = customWeaponDraft.name.trim();
  if (!name) {
    customWeaponError.value = '请输入武器名称';
    return;
  }
  if (allWeapons.value.some((item) => item.name === name)) {
    customWeaponError.value = '武器名称重复';
    return;
  }
  if (!customWeaponDraft.s1 || !customWeaponDraft.s2 || !customWeaponDraft.s3) {
    customWeaponError.value = '请完整选择 S1 / S2 / S3';
    return;
  }
  customWeapons.value = [
    ...customWeapons.value,
    {
      name,
      rarity: Number(customWeaponDraft.rarity) || 6,
      type: customWeaponDraft.type,
      short: '自定义',
      chars: [],
      s1: customWeaponDraft.s1,
      s2: customWeaponDraft.s2,
      s3: customWeaponDraft.s3,
      isPreview: true,
    },
  ];
  resetCustomWeaponDraft();
}

function removeCustomWeapon(name: string) {
  customWeapons.value = customWeapons.value.filter((item) => item.name !== name);
  if (props.state.selectedWeapons.includes(name)) {
    emit('update:selectedWeapons', props.state.selectedWeapons.filter((item) => item !== name));
  }
}

const CUSTOM_WEAPONS_STORAGE_KEY = 'modern-planner-custom-weapons:v1';
try {
  const raw = window.localStorage.getItem(CUSTOM_WEAPONS_STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as Weapon[];
    if (Array.isArray(parsed)) {
      customWeapons.value = parsed.filter((item) => item && item.name && item.s1 && item.s2 && item.s3);
    }
  }
} catch {
  window.localStorage.removeItem(CUSTOM_WEAPONS_STORAGE_KEY);
}

watch(
  () => customWeapons.value,
  (value) => {
    window.localStorage.setItem(CUSTOM_WEAPONS_STORAGE_KEY, JSON.stringify(value));
  },
  { deep: true },
);

function toggleSchemeBasePick(schemeKey: string, value: string) {
  const current = [...(schemeBaseSelections.value[schemeKey] || [])];
  const index = current.indexOf(value);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(value);
  }
  schemeBaseSelections.value = {
    ...schemeBaseSelections.value,
    [schemeKey]: current,
  };
}

function onSchemeWeaponClick(schemeKey: string, baseOverflow: boolean, weaponName: string) {
  if (baseOverflow) {
    const s1 = getWeapon(weaponName)?.s1 || '';
    if (!s1) return;
    toggleSchemeBasePick(schemeKey, s1);
    return;
  }
  toggleWeaponSelection(weaponName);
}

function isConflictOpen(schemeKey: string): boolean {
  return Boolean(conflictOpenMap.value[schemeKey]);
}

function toggleConflictOpen(schemeKey: string) {
  conflictOpenMap.value = {
    ...conflictOpenMap.value,
    [schemeKey]: !conflictOpenMap.value[schemeKey],
  };
}

function setConfig(partial: Partial<RecommendationConfig>) {
  emit('update:recommendationConfig', partial);
}

function isPlanConfigSectionCollapsed(key: string): boolean {
  const name = String(key || '');
  if (!name) return true;
  if (!planConfigSectionManuallySet.value) return true;
  const map = planConfigSectionCollapsed.value || {};
  return map[name] !== false;
}

function togglePlanConfigSectionCollapsed(key: string) {
  const name = String(key || '');
  if (!name) return;
  const current = isPlanConfigSectionCollapsed(name);
  planConfigSectionCollapsed.value = {
    ...planConfigSectionCollapsed.value,
    [name]: !current,
  };
  if (!planConfigSectionManuallySet.value) {
    planConfigSectionManuallySet.value = true;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (!showPlanConfig.value) return;
  const target = event.target as HTMLElement | null;
  if (!target) {
    showPlanConfig.value = false;
    return;
  }
  if (target.closest('.plan-config-toggle')) {
    return;
  }
  if (planConfigRoot.value && planConfigRoot.value.contains(target)) {
    return;
  }
  showPlanConfig.value = false;
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});

function triggerMarksImport() {
  marksImportInput.value?.click();
}

function handleMarksImportFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const raw = e.target?.result as string;
    emit('import:weaponMarks', raw);
  };
  reader.readAsText(file);
  input.value = '';
}

watch(
  () => props.state.selectedWeapons.length,
  (count) => {
    if (count === 1) {
      showAllSchemes.value = true;
      return;
    }
    showAllSchemes.value = false;
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.planner-inline-tools {
  background: var(--planner-surface-soft);
  border: 1px solid var(--planner-item-border);
}

.config-section-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 2px;
  border: none;
  background: transparent;
  color: var(--planner-text-secondary);
  font-size: 12px;
  cursor: pointer;
}

.weapon-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  min-height: 124px;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  border: 1px solid rgba(var(--color-white-rgb), 0.08);
  background: rgba(var(--color-black-rgb), var(--alpha-92));
  cursor: pointer;
  transition: 0.2s ease;
  overflow: hidden;
  content-visibility: auto;
  contain-intrinsic-size: 124px 124px;

  &:hover {
    border-color: rgba(var(--color-white-rgb), var(--alpha-35));
    transform: none;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    border: 2px solid transparent;
    background: rgba(255, 255, 255, 0);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    opacity: 0;
    z-index: 4;
    pointer-events: none;
    transition: opacity 0.2s ease, border-color 0.2s ease;
  }

  &:hover::after {
    opacity: 1;
    border-color: rgba(var(--color-white-rgb), var(--alpha-75));
    background: rgba(var(--color-white-rgb), var(--alpha-03));
    box-shadow: 0 0 0 2px rgba(var(--color-white-rgb), var(--alpha-40));
  }

  &.is-selected {
    border-color: rgba(var(--color-accent-rgb), var(--alpha-95));
    box-shadow:
      0 0 0 2px rgba(var(--color-accent-rgb), var(--alpha-50)),
      0 0 0 6px rgba(var(--color-accent-rgb), var(--alpha-22)),
      0 20px 34px rgba(var(--color-black-rgb), var(--alpha-50));
    background: radial-gradient(120% 120% at 50% 0%, rgba(var(--color-accent-rgb), var(--alpha-28)), rgba(var(--color-black-rgb), var(--alpha-92)) 60%);

    &::after {
      opacity: 1;
      border-color: rgba(var(--color-accent-rgb), var(--alpha-85));
      background: linear-gradient(135deg, rgba(var(--color-accent-rgb), var(--alpha-28)), rgba(var(--color-black-rgb), var(--alpha-00)));
      box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), var(--alpha-45)), inset 0 0 24px rgba(var(--color-accent-rgb), var(--alpha-28));
    }

    .weapon-name {
      color: rgba(var(--color-accent-rgb), var(--alpha-100));
      text-shadow: 0 2px 10px rgba(var(--color-accent-rgb), var(--alpha-35));
    }
  }

  &.is-essence-owned {
    opacity: var(--alpha-55);

    .weapon-name {
      text-decoration: line-through;
      text-decoration-thickness: 1px;
    }
  }
}

.weapon-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--weapon-frame-bg);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  opacity: var(--alpha-90);
  z-index: 0;
  pointer-events: none;
}

.weapon-art {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.weapon-figure {
  width: 100%;
  height: 100%;
  object-fit: cover;
  padding: 0;
  filter: none;
}

.weapon-fallback-large {
  font-weight: 700;
  color: #e6e9ef;
}

.weapon-band {
  position: absolute;
  left: -1px;
  right: -1px;
  bottom: 0;
  height: 42.5px;
  z-index: 2;
  background-image: linear-gradient(90deg, rgba(122, 118, 148, var(--alpha-70)), rgba(84, 82, 110, var(--alpha-90)));
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center bottom;
}

.weapon-item.rarity-6 .weapon-band {
  background-image: var(--rarity-6-frame);
}

.weapon-item.rarity-5 .weapon-band {
  background-image: var(--rarity-5-frame);
}

.weapon-item.rarity-4 .weapon-band {
  background-image: var(--rarity-4-frame);
}

.weapon-avatars {
  position: absolute;
  top: clamp(6px, 1.4vw, 10px);
  left: clamp(6px, 1.4vw, 10px);
  display: flex;
  gap: clamp(4px, 1vw, 6px);
  pointer-events: none;
  z-index: 3;
}

.weapon-avatar {
  width: clamp(26px, 6vw, 40px);
  height: clamp(26px, 6vw, 40px);
  border-radius: 50%;
  object-fit: cover;
  background: rgba(10, 14, 22, var(--alpha-60));
  border: 1px solid rgba(var(--color-white-rgb), var(--alpha-35));
  box-shadow: 0 2px 6px rgba(var(--color-black-rgb), var(--alpha-35));
}

.weapon-corner-stack {
  position: absolute;
  top: 6px;
  right: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  max-width: 62%;
  pointer-events: none;
}

.weapon-custom-chip,
.weapon-hidden-chip {
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weapon-custom-chip {
  order: 0;
  align-self: flex-end;
  border: 1px solid rgba(103, 193, 255, 0.5);
  background: rgba(83, 169, 236, 0.88);
  color: rgba(11, 18, 25, 0.96);
}

.weapon-hidden-chip {
  position: static;
  order: 2;
  z-index: 1;
  max-width: 100%;
  border: 1px solid rgba(var(--color-rarity-5-rgb), var(--alpha-65));
  background: rgba(45, 35, 18, var(--alpha-78));
  color: rgba(var(--color-rarity-5-rgb), var(--alpha-90));
  text-align: center;
}

.weapon-ownership-badge {
  position: absolute;
  right: 6px;
  bottom: 36px;
  z-index: 5;
  padding: clamp(1px, 0.4vw, 2px) clamp(4px, 0.8vw, 6px);
  border-radius: 999px;
  font-size: clamp(8px, 1vw, 10px);
  line-height: 1.2;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(60%, 84px);
  pointer-events: none;
}

.weapon-ownership-badge.is-owned {
  border: 1px solid rgba(var(--color-accent-rgb), var(--alpha-50));
  background: rgba(var(--color-ok-rgb), var(--alpha-88));
  color: rgba(var(--color-black-rgb), var(--alpha-96));
}

.weapon-ownership-badge.is-unowned {
  border: 1px solid rgba(var(--color-rarity-5-rgb), var(--alpha-50));
  background: rgba(45, 35, 18, var(--alpha-78));
  color: rgba(var(--color-rarity-5-rgb), var(--alpha-90));
  max-width: min(54%, 68px);
}

.weapon-name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  font-family: 'SF Pro', 'Noto Sans', 'Segoe UI', 'Helvetica Neue', 'Source Han Sans', 'Arial', system-ui, sans-serif;
  font-size: 14px;
  line-height: 120%;
  font-weight: 600;
  letter-spacing: 0;
  text-align: center;
  color: #f5f2ee;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 6px rgba(var(--color-black-rgb), var(--alpha-65));
  z-index: 3;
}

.weapon-item.rarity-6 .weapon-name,
.weapon-item.rarity-6 .weapon-title-text {
  color: #ffcf84;
}

.weapon-item.rarity-5 .weapon-name,
.weapon-item.rarity-5 .weapon-title-text {
  color: #cbd5ff;
}

.weapon-item.rarity-4 .weapon-name,
.weapon-item.rarity-4 .weapon-title-text {
  color: #c4ccd6;
}

.weapon-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
}

.weapon-title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.rarity-6 {
  color: #ffb36a;
}

.rarity-5 {
  color: #b9c7ff;
}

.rarity-4 {
  color: #9aa5b1;
}

.weapon-avatar-strip.inline {
  display: flex;
  align-items: center;
  gap: 6px;
  position: static;
  top: auto;
  left: auto;
  justify-content: flex-start;
  margin-top: 0;
}

.weapon-char-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(10, 14, 22, 0.6);
  border: 1px solid rgba(201, 216, 240, 0.55);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.42);
}

.weapon-avatar-strip.inline .weapon-avatar,
.weapon-avatar-strip.inline .weapon-char-avatar {
  width: 28px;
  height: 28px;
}

.conflict-banner {
  background: var(--planner-surface-soft) !important;
  color: var(--planner-text-primary) !important;
  border: 1px solid var(--planner-item-border);
}

.planner-scheme-header {
  background: var(--planner-surface-soft) !important;
}

:deep(.planner-note-input) {
  color: var(--planner-text-primary) !important;
}

.scheme-weapon-row {
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--planner-surface-soft);
  }

  &.scheme-weapon-selected {
    background: rgba(25, 118, 210, 0.08);
    border-left: 3px solid var(--q-primary);
    padding-left: calc(0.5rem - 3px);
  }

  &.base-pick-mode {
    border-left: 3px solid transparent;
  }

  &.is-dim {
    opacity: 0.62;
  }
}
</style>
