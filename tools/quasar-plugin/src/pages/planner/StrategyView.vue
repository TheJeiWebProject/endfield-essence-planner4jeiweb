<template>
	<div class="planner-layout single-column">
		<q-card flat bordered class="panel-card">
			<q-card-section class="row items-center justify-between">
				<div class="text-subtitle1">角色攻略</div>
				<q-chip color="primary" text-color="white">{{ characters.length }} 名角色</q-chip>
			</q-card-section>

			<q-separator />

			<q-card-section v-if="!currentCharacter">
				<q-input v-model="keyword" dense outlined placeholder="搜索角色 / 武器...">
					<template #append>
						<q-icon name="search" />
					</template>
				</q-input>

				<div class="character-grid q-mt-md">
					<div
						v-for="row in filteredRows"
						:key="row.character.id"
						class="character-card"
						@click="selectCharacter(row.character.id)"
					>
						<img :src="getCharacterImageUrl(row.character.name)" class="character-avatar" loading="lazy" />
						<div class="character-name">{{ row.character.name }}</div>
						<div class="character-meta text-caption text-grey-5">
							{{ row.character.rarity || '-' }}★ · {{ row.character.element || '-' }}
						</div>
						<div class="weapon-chips q-mt-sm">
							<q-chip
								v-for="weapon in row.weapons.slice(0, 3)"
								:key="row.character.id + '-' + weapon"
								dense
								square
								color="grey-9"
								text-color="white"
								clickable
								@click.stop="toggleWeaponSelection(weapon)"
							>
								{{ weapon }}
							</q-chip>
						</div>
					</div>
				</div>

				<div v-if="filteredRows.length === 0" class="text-center text-grey-6 q-py-lg">暂无匹配角色</div>
			</q-card-section>

			<q-card-section v-else>
				<div v-if="attributionEntries.length" class="guide-attributions q-mb-md">
					<div class="text-caption text-grey-5 q-mb-xs">攻略署名</div>
					<div class="row q-gutter-sm q-gutter-y-xs">
						<q-chip
							v-for="(entry, index) in attributionEntries"
							:key="`attr-${index}`"
							square
							color="grey-9"
							text-color="white"
							clickable
							:tag="entry.url ? 'a' : 'div'"
							:href="entry.url || undefined"
							target="_blank"
							rel="noreferrer"
						>
							{{ entry.role || '署名' }} · {{ entry.name || '-' }}
						</q-chip>
					</div>
				</div>

				<div class="row items-center justify-between q-mb-md">
					<div class="row items-center q-gutter-sm">
						<q-btn flat dense icon="arrow_back" label="返回列表" @click="backToList" />
						<div class="text-h6">{{ currentCharacter.name }}</div>
					</div>
					<q-chip color="secondary" text-color="white">{{ currentCharacter.rarity || '-' }}★</q-chip>
				</div>

				<div class="row q-col-gutter-md q-mb-md detail-hero">
					<div class="col-12 col-md-auto">
						<img :src="getCharacterImageUrl(currentCharacter.name)" class="detail-avatar" loading="lazy" />
					</div>
					<div class="col-12 col-md">
						<div class="text-body2">元素：{{ currentCharacter.element || '-' }}</div>
						<div class="text-body2">武器：{{ currentCharacter.weaponType || '-' }}</div>
						<div class="text-body2">职业：{{ currentCharacter.profession || currentCharacter.role || '-' }}</div>
						<div class="text-body2">主副属性：{{ currentCharacter.mainAbility || '-' }} / {{ currentCharacter.subAbility || '-' }}</div>
					</div>
					<div class="col-12 col-md-auto" v-if="characterCardUrl(currentCharacter)">
						<img :src="characterCardUrl(currentCharacter)" class="detail-card-image" loading="lazy" @error="onCharacterCardError" />
					</div>
				</div>

				<q-tabs v-model="strategyCategory" dense align="left" active-color="primary" indicator-color="primary">
					<q-tab name="info" label="角色信息" />
					<q-tab name="guide" label="攻略内容" />
				</q-tabs>

				<q-separator class="q-my-sm" />

				<q-tabs
					v-if="strategyCategory === 'info'"
					v-model="strategyTab"
					dense
					align="left"
					active-color="secondary"
					indicator-color="secondary"
				>
					<q-tab name="base" label="基础属性" />
					<q-tab name="skillsTalents" label="技能天赋" />
					<q-tab name="potentials" label="潜能" />
				</q-tabs>

				<q-tabs
					v-else
					v-model="strategyTab"
					dense
					align="left"
					active-color="secondary"
					indicator-color="secondary"
				>
					<q-tab name="analysis" label="分析" />
					<q-tab name="team" label="配队" />
					<q-tab name="operation" label="操作" />
				</q-tabs>

				<q-separator class="q-my-sm" />

				<div v-if="strategyCategory === 'info' && strategyTab === 'base'" class="tab-panel q-gutter-y-md">
					<div class="stats-grid">
						<div class="stat-item">力量：{{ currentCharacter.stats?.strength || '-' }}</div>
						<div class="stat-item">敏捷：{{ currentCharacter.stats?.agility || '-' }}</div>
						<div class="stat-item">智识：{{ currentCharacter.stats?.intellect || '-' }}</div>
						<div class="stat-item">意志：{{ currentCharacter.stats?.will || '-' }}</div>
						<div class="stat-item">攻击：{{ currentCharacter.stats?.attack || '-' }}</div>
						<div class="stat-item">生命：{{ currentCharacter.stats?.hp || '-' }}</div>
					</div>

					<q-card flat bordered class="panel-card-inner">
						<q-card-section>
							<div class="text-subtitle2 q-mb-sm">精英材料</div>
							<div class="materials-grid">
								<div v-for="level in materialLevels" :key="level" class="material-block">
									<div class="text-caption text-grey-5 q-mb-xs">精英 {{ level.replace('elite', '') }}</div>
									<div class="material-tags">
										<q-chip
											v-for="(item, index) in materialEntries(level)"
											:key="`${level}-${index}`"
											dense
											square
											color="grey-9"
											text-color="white"
										>
											{{ item }}
										</q-chip>
										<span v-if="!materialEntries(level).length" class="text-grey-6">暂无</span>
									</div>
								</div>
							</div>
						</q-card-section>
					</q-card>
				</div>

				<div v-if="strategyCategory === 'info' && strategyTab === 'skillsTalents'" class="tab-panel q-gutter-y-md">
					<div>
						<div class="text-subtitle2 q-mb-sm">技能</div>
						<q-expansion-item
							v-for="(skill, idx) in (currentCharacter.skills || [])"
							:key="`skill-${idx}-${skill.name}`"
							:label="skill.name"
							:caption="skill.type"
							header-class="skill-header"
							expand-icon-class="text-primary"
							class="editor-expansion q-mb-sm"
						>
							<q-card flat class="panel-card-inner">
								<q-card-section>
									<div class="preline">{{ skill.description }}</div>
									<div v-if="skill.dataTables?.length" class="q-mt-md">
										<div v-for="table in skill.dataTables" :key="table.title" class="q-mb-md">
											<div class="text-caption text-grey-5 q-mb-xs">{{ table.title }}</div>
											<q-table
												dense
												flat
												bordered
												:rows="table.rows"
												:columns="skillTableColumns"
												row-key="name"
												hide-pagination
												:rows-per-page-options="[0]"
												class="skill-table"
											>
												<template #body-cell-values="cellProps">
													<q-td :props="cellProps">
														<div class="row q-gutter-xs">
															<q-badge
																v-for="(val, valueIndex) in cellProps.row.values"
																:key="valueIndex"
																color="grey-8"
																:label="val"
																size="sm"
															/>
														</div>
													</q-td>
												</template>
											</q-table>
										</div>
									</div>
								</q-card-section>
							</q-card>
						</q-expansion-item>
					</div>

					<div v-if="currentCharacter.talents?.length">
						<div class="text-subtitle2 q-mb-sm">天赋</div>
						<q-expansion-item
							v-for="(talent, idx) in (currentCharacter.talents || [])"
							:key="`talent-${idx}-${talent.name}`"
							:label="talent.name"
							:caption="talent.type"
							header-class="skill-header"
							expand-icon-class="text-secondary"
							class="editor-expansion q-mb-sm"
						>
							<q-card flat class="panel-card-inner">
								<q-card-section>
									<div class="preline">{{ talent.description }}</div>
								</q-card-section>
							</q-card>
						</q-expansion-item>
					</div>

					<div v-if="currentCharacter.baseSkills?.length">
						<div class="text-subtitle2 q-mb-sm">基础技能</div>
						<q-card v-for="(skill, idx) in (currentCharacter.baseSkills || [])" :key="`base-skill-${idx}-${skill.name}`" flat bordered class="q-mb-sm">
							<q-card-section>
								<div class="row items-center q-gutter-sm q-mb-xs">
									<div class="text-subtitle2">{{ skill.name }}</div>
									<q-badge v-if="skill.type" color="teal" outline>{{ skill.type }}</q-badge>
								</div>
								<div class="preline">{{ skill.description }}</div>
							</q-card-section>
						</q-card>
					</div>
				</div>

				<div v-if="strategyCategory === 'info' && strategyTab === 'potentials'" class="tab-panel">
					<q-list bordered separator>
						<q-item v-for="(p, idx) in (currentCharacter.potentials || [])" :key="`pot-${idx}`">
							<q-item-section>
								<q-item-label>潜能 {{ idx + 1 }}</q-item-label>
								<q-item-label caption class="preline">{{ resolvePotentialText(p) }}</q-item-label>
							</q-item-section>
						</q-item>
					</q-list>
				</div>

				<div v-if="strategyCategory === 'guide' && strategyTab === 'analysis'" class="tab-panel preline">
					{{ guideText('analysis') || '暂无' }}
				</div>

				<div v-if="strategyCategory === 'guide' && strategyTab === 'operation'" class="tab-panel preline">
					{{ guideText('operationTips', 'operation') || '暂无' }}
				</div>

				<div v-if="strategyCategory === 'guide' && strategyTab === 'team'" class="tab-panel">
					<div class="preline q-mb-md">{{ guideText('teamTips') || '暂无' }}</div>
					<div v-if="teamSlots.length" class="team-grid q-mb-md">
						<q-card v-for="(slot, idx) in teamSlots" :key="`slot-${idx}`" flat bordered>
							<q-card-section>
								<div class="text-subtitle2 q-mb-sm">{{ slot?.name || `位置 ${idx + 1}` }}</div>
								<div class="row q-gutter-sm">
									<q-chip
										v-for="weapon in slotWeapons(slot)"
										:key="`slot-w-${idx}-${weapon}`"
										dense
										square
										color="grey-9"
										text-color="white"
										clickable
										@click="toggleWeaponSelection(weapon)"
									>
										{{ weapon }}
									</q-chip>
								</div>
							</q-card-section>
						</q-card>
					</div>

					<div class="text-subtitle2 q-mb-sm">配装推荐</div>
					<q-card v-for="(row, idx) in guideRows" :key="`equip-row-${idx}`" flat bordered class="q-mb-sm">
						<q-card-section>
							<div class="text-caption text-grey-5 q-mb-sm">{{ idx === 0 ? '优先方案' : '备选方案' }}</div>
							<div class="row q-gutter-sm q-mb-sm">
								<div
									v-for="weapon in row.weapons"
									:key="`rw-${idx}-${weapon.name}`"
									class="guide-weapon-chip"
									@click="toggleWeaponSelection(weapon.name)"
								>
									<img v-if="getWeaponImageUrl(weapon.name)" :src="getWeaponImageUrl(weapon.name)" class="guide-weapon-img" />
									<div>
										<div class="guide-weapon-name">{{ weapon.name }}</div>
										<div v-if="weapon.note" class="text-caption text-grey-5">{{ weapon.note }}</div>
									</div>
								</div>
							</div>
						</q-card-section>
					</q-card>
				</div>
			</q-card-section>
		</q-card>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getCharacters, getWeaponImageId, getWeapons, toLegacyAssetUrl } from '@/core/data';
import type { Character, PlannerState } from '@/core/types';

type StrategyCategory = 'info' | 'guide';
type StrategyTab = 'base' | 'skillsTalents' | 'potentials' | 'analysis' | 'team' | 'operation';

interface GuideWeaponRow {
	name: string;
	note?: string;
}

const props = defineProps<{
	state: PlannerState;
	weaponMarks: Record<string, unknown>;
}>();

const emit = defineEmits<{
	(e: 'update:selectedWeapons', value: string[]): void;
	(e: 'update:selectedCharacterId', value: string | null): void;
}>();

const allWeapons = getWeapons();
const weaponNameSet = new Set(allWeapons.map((w) => w.name));
const characters = getCharacters().slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
const materialLevels = ['elite1', 'elite2', 'elite3', 'elite4'];
const skillTableColumns = [
	{ name: 'name', label: '数值名称', field: 'name', align: 'left' as const },
	{ name: 'values', label: '等级数值', field: 'values', align: 'left' as const },
];

const keyword = ref('');
const selectedCharacterId = ref<string | null>(props.state.selectedCharacterId || null);
const strategyCategory = ref<StrategyCategory>('info');
const strategyTab = ref<StrategyTab>('base');

watch(
	() => props.state.selectedCharacterId,
	(value) => {
		if ((value || null) !== selectedCharacterId.value) {
			selectedCharacterId.value = value || null;
		}
	},
);

const rows = computed(() => {
	return characters.map((character) => {
		const weapons = allWeapons.filter((w) => (w.chars || []).includes(character.name)).map((w) => w.name);
		return { character, weapons };
	});
});

const filteredRows = computed(() => {
	const kw = keyword.value.trim().toLowerCase();
	if (!kw) return rows.value;
	return rows.value.filter((row) => {
		const byName = row.character.name.toLowerCase().includes(kw);
		const byWeapon = row.weapons.some((w) => w.toLowerCase().includes(kw));
		return byName || byWeapon;
	});
});

const currentCharacter = computed<Character | null>(() => {
	if (!selectedCharacterId.value) return null;
	return characters.find((c) => c.id === selectedCharacterId.value) || null;
});

const currentGuide = computed<Record<string, unknown> | null>(() => {
	return (currentCharacter.value?.guide as Record<string, unknown>) || null;
});

const attributionEntries = computed(() => {
	const entries = currentGuide.value?.attributions;
	return Array.isArray(entries) ? (entries as Array<Record<string, string>>) : [];
});

const guideRows = computed(() => {
	const rowsValue = currentGuide.value?.equipRows;
	if (!Array.isArray(rowsValue)) return [];
	return rowsValue.map((row) => {
		const weapons = Array.isArray((row as { weapons?: unknown[] }).weapons)
			? ((row as { weapons?: unknown[] }).weapons as Array<Record<string, unknown>>)
					.map((weapon) => ({
						name: String(weapon.name || '').trim(),
						note: typeof weapon.note === 'string' ? weapon.note : '',
					}))
					.filter((weapon) => Boolean(weapon.name))
			: [];
		return { weapons };
	});
});

const teamSlots = computed(() => {
	const slots = currentGuide.value?.teamSlots;
	return Array.isArray(slots) ? (slots as Array<Record<string, unknown>>) : [];
});

function materialEntries(level: string): string[] {
	const materials = currentCharacter.value?.materials as Record<string, unknown> | undefined;
	const list = materials && Array.isArray(materials[level]) ? (materials[level] as string[]) : [];
	return list.filter(Boolean);
}

function slotWeapons(slot: Record<string, unknown> | null | undefined): string[] {
	if (!slot) return [];
	const options = Array.isArray(slot.options) ? (slot.options as Array<Record<string, unknown>>) : [];
	const set = new Set<string>();
	options.forEach((opt) => {
		const list = Array.isArray(opt.weapons) ? (opt.weapons as Array<Record<string, unknown>>) : [];
		list.forEach((weapon) => {
			const name = String(weapon.name || '').trim();
			if (name) set.add(name);
		});
	});
	return [...set];
}

function guideText(...keys: string[]): string {
	if (!currentGuide.value) return '';
	for (const key of keys) {
		const value = currentGuide.value[key];
		if (typeof value === 'string' && value.trim()) {
			return value;
		}
	}
	return '';
}

function selectCharacter(id: string) {
	selectedCharacterId.value = id;
	strategyCategory.value = 'info';
	strategyTab.value = 'base';
	emit('update:selectedCharacterId', id);
}

function backToList() {
	selectedCharacterId.value = null;
	emit('update:selectedCharacterId', null);
}

function getCharacterImageUrl(name: string): string {
	return toLegacyAssetUrl(`legacy/image/characters/${encodeURIComponent(name)}.avif`);
}

function characterCardUrl(character: Character | null): string {
	if (!character) return '';
	const name = character.name || character.id;
	return name ? toLegacyAssetUrl(`legacy/image/characters/${encodeURIComponent(name)}_card.avif`) : '';
}

function onCharacterCardError(event: Event) {
	const target = event.target as HTMLImageElement | null;
	if (target) target.style.display = 'none';
}

function getWeaponImageUrl(name: string): string {
	const id = getWeaponImageId(name);
	return id ? toLegacyAssetUrl(`legacy/image/weapon/${encodeURIComponent(id)}.avif`) : '';
}

function toggleWeaponSelection(weapon: string) {
	if (props.state.readonly || !weaponNameSet.has(weapon)) return;
	const current = props.state.selectedWeapons;
	if (current.includes(weapon)) {
		emit('update:selectedWeapons', current.filter((w) => w !== weapon));
		return;
	}
	emit('update:selectedWeapons', [...new Set([...current, weapon])]);
}

function resolvePotentialText(value: unknown): string {
	if (!value) return '-';
	if (typeof value === 'string') return value;
	if (typeof value === 'object') {
		const maybe = value as { name?: string; description?: string };
		return [maybe.name, maybe.description].filter(Boolean).join('：') || JSON.stringify(value);
	}
	return String(value);
}
</script>

<style scoped lang="scss">
.character-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 12px;
}

.character-card {
	padding: 12px;
	border: 1px solid var(--planner-item-border);
	border-radius: 8px;
	background: var(--planner-surface-soft);
	cursor: pointer;
}

.character-avatar {
	width: 72px;
	height: 72px;
	border-radius: 50%;
	object-fit: cover;
	display: block;
	margin: 0 auto 8px;
}

.character-name {
	text-align: center;
	font-weight: 600;
}

.character-meta {
	text-align: center;
}

.weapon-chips,
.material-tags {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
}

.detail-hero {
	align-items: center;
}

.detail-avatar {
	width: 96px;
	height: 96px;
	border-radius: 12px;
	object-fit: cover;
}

.detail-card-image {
	width: 132px;
	max-width: 100%;
	border-radius: 12px;
	object-fit: cover;
	border: 1px solid var(--planner-item-border);
}

.tab-panel {
	margin-top: 12px;
}

.preline {
	white-space: pre-line;
}

.stats-grid,
.materials-grid,
.team-grid {
	display: grid;
	gap: 10px;
}

.stats-grid {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.materials-grid,
.team-grid {
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.stat-item,
.material-block {
	padding: 8px 10px;
	border: 1px solid var(--planner-item-border);
	border-radius: 6px;
	background: var(--planner-surface-soft);
}

.guide-weapon-chip {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 6px 8px;
	border: 1px solid var(--planner-item-border);
	border-radius: 8px;
	background: var(--planner-surface-soft);
	cursor: pointer;
}

.guide-weapon-img {
	width: 32px;
	height: 32px;
	border-radius: 6px;
}

.guide-weapon-name {
	font-size: 12px;
	font-weight: 600;
}

@media (max-width: 640px) {
	.stats-grid {
		grid-template-columns: 1fr;
	}
}
</style>

