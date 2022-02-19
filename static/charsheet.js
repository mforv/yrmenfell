const SKILLS = await fetch('https://mforv.github.io/yrmenfell/static/data/skills.json').then(resp => resp.json());
const SPELLS = await fetch('https://mforv.github.io/yrmenfell/static/data/spells.json').then(resp => resp.json());
const TABLES = await fetch('https://mforv.github.io/yrmenfell/static/data/tables.json').then(resp => resp.json());

const introText = await fetch('https://mforv.github.io/yrmenfell/static/data/intro.txt').then(resp => resp.text());

export const attrClasses = ['body', 'mind', 'control']
const attrNames = ['Тело', 'Разум', 'Контроль']
const statShort = ['ЗДР', 'ВОЛ', 'ИНЦ']
const skillRanks = ['I', 'II', 'III']
const SKILL_LEVELS_DEFAULT = ["+2🎲 при проверке", "+4🎲 при проверке", "+6🎲 при проверке"]
const spellArcana = {
    "sm08": "gold",
    "sm09": "mercury",
    "sm10": "silver",
    "sm11": "cobalt",
    "sm12": "copper"
}
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
const defaultMoney = 100;

const charTemplate = {
    "id": "",
    "name": "",
    "key_attr": 0,
    "attrs": [1, 1, 1],
    "stats": [3, 3, 1],
    "skills": {},
    "xp": 12,
    "xp_total": 12,
    "hand_main": "",
    "hand_off": "",
    "attire": "",
    "magic": [],
    "lore": "",
    "backpack": "",
    "money": 0,
    "bio": "",
    "notes": ""
}

const plusSVG = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="1em" height="1em" style="vertical-align: -0.125em;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z" fill="currentColor"/></svg>'
const helpSVG = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="1em" height="1em" style="vertical-align: -0.125em;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M10 19h3v3h-3v-3m2-17c5.35.22 7.68 5.62 4.5 9.67c-.83 1-2.17 1.66-2.83 2.5C13 15 13 16 13 17h-3c0-1.67 0-3.08.67-4.08c.66-1 2-1.59 2.83-2.25C15.92 8.43 15.32 5.26 12 5a3 3 0 0 0-3 3H6a6 6 0 0 1 6-6z" fill="currentColor"></path></svg>'
const closeSVG = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="1em" height="1em" style="vertical-align: -0.125em;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" fill="currentColor"></path></svg>'

function sNum(n) { return ((n <= 0 ? '' : '+' ) + n).replace('-', '&minus;') }
function sMon(n) { return (1*n).toLocaleString('ru-RU', {useGrouping: true}); }

/** Сгенерить идентификатор персонажа */
export function genCharId(length=9)
{
    let next_id = 'y';
    for (let i = 0; i < length; i++)
    {
        next_id += alphabet[Math.floor(0 + Math.random() * alphabet.length)];
    }
    return next_id
}

/** Отобразить экран вводной информации о мире */
function displayIntroScreen(char)
{
    document.querySelector('.glass-cover').classList.remove('hidden');
    const introScreen = document.querySelector('#intro-modal');
    const introTextCont = introScreen.querySelector('#intro-text-cont');

    let introLines = introText.split('\n');
    for (let line of introLines)
    {
        introTextCont.innerHTML += `<p>${line}</p>`
    }

    document.querySelector('#intro-close').addEventListener('click', 
    () => { closeGlassModal(); displayTrainScreen(char); });

    introScreen.classList.remove('hidden');
}

/** Отобразить экран прокачки атрибутов и покупки навыков */
function displayTrainScreen(char)
{
    document.querySelector('.glass-cover').classList.remove('hidden');
    const trainScreen = document.querySelector('#train-modal');

    renderCloseButton(document.querySelector('#train-close'));
    document.querySelector('#train-close').addEventListener('click', closeGlassModal);

    document.querySelector('#toggle-skill-info').onmouseenter = (event) => { showHint(event, 'Переключение показа всплывающей информации о навыках') }
    document.querySelector('#toggle-skill-info').onmouseleave = () => hideModal()

    trainScreen.classList.remove('hidden');

    while (trainScreen.querySelector('.inner-block.train'))
    { trainScreen.removeChild(trainScreen.querySelector('.inner-block.train'))}
    if (trainScreen.querySelector('.char-up-table'))
    { trainScreen.removeChild(trainScreen.querySelector('.char-up-table'))}

    const attrUp = document.createElement('div');
    attrUp.className = 'inner-block train';
    trainScreen.appendChild(attrUp);
    for (let [attrId, attrLvl] of char.attrs.entries())
    {
        let attrCost = attrLvl < 9 ? 1 : 3;
        attrCost = char.key_attr === attrId ? attrCost : attrCost * 2;
        let upBtnState = attrCost <= char.xp && char.attrs[attrId] < 12 ? '' : 'disabled';
        let attrUpText = attrLvl === 12 ? 'MAX' : `Повысить (${attrCost} XP)`;
        const attrName = window.matchMedia("(max-width: 650px)").matches ? attrNames[attrId].slice(0, 3) : attrNames[attrId];
        const attrEntry = document.createElement('div');
        attrEntry.className = `attr-cell ${attrClasses[attrId]}`;
        attrEntry.style.cssText = "gap: 0.25rem; flex-direction: column;";
        attrEntry.innerHTML = `
            <div class="attr-data">${char.attrs[attrId]} ${attrName}</div>
            <button id="${char.id}-attr-${attrId}-up-btn" ${upBtnState}>${attrUpText}</button>`;
        attrUp.appendChild(attrEntry);
        document.querySelector(`#${char.id}-attr-${attrId}-up-btn`).addEventListener('click', () => levelUpAttr(char, attrId, attrCost));
    }

    const skillTable = document.createElement('div');
    trainScreen.appendChild(skillTable);

    skillTable.className = "char-up-table";
    for (let [skillId, skill] of Object.entries(SKILLS))
    {
        let skillCost = 1;
        let curSkillLvl = 0;
        let attrMin = 2;
        if (char.skills[skillId])
        {
            const rawSkillLvl = char.skills[skillId]
            curSkillLvl = rawSkillLvl;
            skillCost = rawSkillLvl * 2;
            attrMin = rawSkillLvl == 1 ? 6 : 10;
        }
        let upBtnState = skillCost <= char.xp && char.attrs[skill.attr] >= attrMin ? '' : 'disabled';
        let skillUpText = `треб. <span class="${attrClasses[skill.attr]}">${attrMin} ${attrNames[skill.attr].slice(0,3).toUpperCase()}</span>`
        let skillRank = curSkillLvl;

        if (curSkillLvl > 2)
        {
            skillUpText = 'Изучено';
            upBtnState = 'disabled';
            skillRank = 2;
        }
        else if (char.attrs[skill.attr] >= attrMin)
        {
            skillUpText = `Изучить (${skillCost} XP)`;
        }

        const skillUpEntry = document.createElement('div');
        skillUpEntry.className = 'char-up-entry';
        skillUpEntry.innerHTML = `
            <span class="${attrClasses[skill.attr]}">●</span> <span class="skill-name">${skill.name}&nbsp;${skillRanks[skillRank]}</span>
            <button id="${skillId}-up-btn" ${upBtnState}>${skillUpText}</button>`;
        skillUpEntry.querySelector('.skill-name').onmouseenter = (event) => {
            if (document.querySelector('#toggle-skill-info').checked) showSkillHint(event, skill);
        }
        skillUpEntry.querySelector('.skill-name').onmouseleave = () => hideModal()
        skillTable.appendChild(skillUpEntry);
        document.querySelector(`#${skillId}-up-btn`).addEventListener('click', () => levelUpSkill(char, skillId, skillCost));
    }
    const resetCharBlock = document.createElement('div');
    resetCharBlock.className = 'inner-block train';
    resetCharBlock.style.cssText = 'border: none; gap: 0.5rem; padding: 0.5rem 0 0;'
    resetCharBlock.innerHTML = '<button class="danger">Сбросить развитие</button>';
    resetCharBlock.querySelector('button').addEventListener('click', displayCharResetScreen);
    trainScreen.appendChild(resetCharBlock);
}

/** Поднять уровень атрибута */
function levelUpAttr(char, attrId, attrCost)
{
    char.attrs[attrId]++;
    const attrLvl = char.attrs[attrId];
    let attrStat = attrId < 2 ? attrLvl * 3 : attrLvl < 4 ? 1 : attrLvl < 8 ? 2 : attrLvl < 12 ? 3 : 4;
    char.stats[attrId] = attrStat;
    char.xp -= attrCost;
    autoSaveChar(char);
    const params = displayCharParams(char);
    document.querySelector(`#${char.id}-attrs`).innerHTML = params[0];
    document.querySelector(`#${char.id}-stats`).innerHTML = params[1];
    document.querySelector(`#${char.id}-xp`).textContent = char.xp;
    checkUnarmedDmg(char);
    displayTrainScreen(char);
}

/** Поднять уровень навыка */
function levelUpSkill(char, skillId, skillCost)
{
    if (char.skills[skillId]) char.skills[skillId]++ 
    else char.skills[skillId] = 1;
    char.xp -= skillCost;
    autoSaveChar(char);
    displayCharSkills(char);
    displayCharMagic(char);
    document.querySelector(`#${char.id}-xp`).textContent = char.xp;
    displayTrainScreen(char);
}

/** Отобразить экран новых заклинаний */
function displayMagicScreen(char)
{
    document.querySelector('.glass-cover').classList.remove('hidden');
    const magicScreen = document.querySelector('#magic-modal');

    renderCloseButton(document.querySelector('#magic-close'));
    document.querySelector('#magic-close').addEventListener('click', closeGlassModal);

    document.querySelector('#toggle-spell-info').onmouseenter = (event) => { showHint(event, 'Переключение показа всплывающей информации о заклинаниях') }
    document.querySelector('#toggle-spell-info').onmouseleave = () => hideModal()

    magicScreen.classList.remove('hidden');

    if (magicScreen.querySelector('.spell-table'))
    { magicScreen.removeChild(magicScreen.querySelector('.spell-table'))}

    const spellTable = document.createElement('div');
    magicScreen.appendChild(spellTable);

    spellTable.className = "spell-table";
    const arcanaConts = []
    for (let i = 0; i < 5; i++)
    {
        const arcCont = document.createElement('div');
        arcCont.id = `arc-`+i;
        arcCont.className = 'spell-list';
        spellTable.appendChild(arcCont);
        arcanaConts.push(arcCont);
    }
    let currentArcanum = 0;
    let currentSpell = 0;
    for (let [spellId, spell] of Object.entries(SPELLS))
    {
        const spellSkill = spell.skill;
        let spellBuyText = `Изучено`;
        let spellBtnState = 'disabled';
        const spellXpCost = spell.level < 3 ? 1 : 2;
        if (!char.magic.includes(spellId))
        {
            spellBuyText = `${SKILLS[spellSkill].name.replace('Арканум', 'А.')} ${skillRanks[spell.level-1]}`;
            if (char.skills[spellSkill] )
            {
                if (char.skills[spellSkill] >= spell.level)
                {
                    spellBuyText = `Изучить (${spellXpCost} XP)`;
                    spellBtnState = char.xp >= spellXpCost ? '' : spellBtnState;
                }
            }
        }
        const spellUpEntry = document.createElement('div');
        spellUpEntry.className = 'char-up-entry';
        spellUpEntry.innerHTML = `
            <span class="arcanum ${spellArcana[spellSkill]}">●</span><span class="spell-name">${spell.name}</span>
            <button id="${spellId}-buy-btn" ${spellBtnState}>${spellBuyText}</button>`;
        spellUpEntry.querySelector('.spell-name').onmouseenter = (event) => {
            if (document.querySelector('#toggle-spell-info').checked) showSpellHint(event, spell);
        }
        spellUpEntry.querySelector('.spell-name').onmouseleave = () => hideModal()
        arcanaConts[currentArcanum].appendChild(spellUpEntry);
        document.querySelector(`#${spellId}-buy-btn`).addEventListener('click', () => {
            char.magic.push(spellId);
            char.xp -= spellXpCost;
            document.querySelector(`#${char.id}-xp`).textContent = char.xp;
            autoSaveChar(char);
            displayCharMagic(char);
            displayMagicScreen(char);
        });
        currentSpell++;
        if (currentSpell === 6)
        {
            currentArcanum++;
            currentSpell = 0;
        }
    }
}

/** Окно добавления XP */
function displayAddXpScreen()
{
    document.querySelector('.glass-cover').classList.remove('hidden');
    const xpScreen = document.querySelector('#add-xp-modal');

    renderCloseButton(document.querySelector('#add-xp-close'));
    document.querySelector('#add-xp-close').addEventListener('click', closeGlassModal);

    xpScreen.classList.remove('hidden');
}

/** Обработка нового опыта */
function addNewXp(char)
{
    let newXp = Number.parseInt(document.querySelector('#add-xp-input').value);
    newXp = Number.isNaN(newXp) ? 0 : newXp;
    char.xp += newXp;
    char.xp_total += newXp;
    document.querySelector(`#${char.id}-xp`).textContent = char.xp;
    document.querySelector(`#${char.id}-xp-total`).textContent = char.xp_total;
    autoSaveChar(char);
    closeGlassModal();
}

/** Окно сброса XP */
function displayResetXpScreen()
{
    resetGlassModals();
    document.querySelector('.glass-cover').classList.remove('hidden');
    const resetXpScreen = document.querySelector('#reset-xp-modal');

    renderCloseButton(document.querySelector('#reset-xp-close'));
    document.querySelector('#reset-xp-close').addEventListener('click', closeGlassModal);
    
    resetXpScreen.classList.remove('hidden');
    resetXpScreen.scrollIntoView();
}

/** Сброс опыта */
function resetXp(char)
{
    char.xp_total = 12;
    resetChar(char);
}

/** Окно сброса персонажа */
function displayCharResetScreen()
{
    resetGlassModals();
    document.querySelector('.glass-cover').classList.remove('hidden');
    const resetScreen = document.querySelector('#reset-char-modal');
    
    renderCloseButton(document.querySelector('#reset-char-close'));
    document.querySelector('#reset-char-close').addEventListener('click', closeGlassModal);
    
    resetScreen.classList.remove('hidden');
    resetScreen.scrollIntoView();
}

/** Сброс атрибутов, навыков и магии */
function resetChar(char)
{
    char.attrs = [1, 1, 1];
    char.stats = [3, 3, 1];
    char.skills = {};
    char.magic = [];
    char.xp = char.xp_total;
    autoSaveChar(char);
    document.querySelector(`#${char.id}-xp`).textContent = char.xp;
    document.querySelector(`#${char.id}-xp-total`).textContent = char.xp_total;
    const params = displayCharParams(char);
    document.querySelector(`#${char.id}-attrs`).innerHTML = params[0];
    document.querySelector(`#${char.id}-stats`).innerHTML = params[1];
    displayCharSkills(char);
    displayCharMagic(char);
    checkUnarmedDmg(char);
    closeGlassModal();
}

/** Заполняем атрибуты и статы */
function displayCharParams(char)
{
    let paramData = ['', ''];
    for (let [attrId, attrLvl] of char.attrs.entries())
    {
        let mod = attrLvl < 2 ? 0 : attrLvl < 6 ? 1 : attrLvl < 10 ? 2 : 3;
        paramData[0] += `
        <div class="attr-cell ${attrClasses[attrId]}">
            <span class="attr-value">${attrLvl}</span>
            <div class="attr-name">
                <strong>${attrNames[attrId].slice(0,3).toUpperCase()}</strong>
                <div>${sNum(mod)}🎲</div>
            </div>
        </div>`;

        let stat = attrId < 2 ? attrLvl * 3 : attrLvl < 4 ? 1 : attrLvl < 8 ? 2 : attrLvl < 12 ? 3 : 4;
        paramData[1] += `
        <div class="attr-cell ${attrClasses[attrId]}" style="font-size: 1.8rem;">
            <input id="${char.id}-stat-${attrId}" type="text" value="${char.stats[attrId]}" class="stat ${attrClasses[attrId]}" style="font-weight: bold; width:3rem;">
            <div class="attr-name">
                <strong>${statShort[attrId]}</strong>
                <div style="font-weight: bold;">/ ${stat}</div>
            </div>
        </div>`;
    }
    return paramData;
}

/** Проверить дамаг без оружия */
function checkUnarmedDmg(char)
{
    const cB = char.attrs[0];
    const noWeaponDmg = cB < 3 ? '1-1-1' : cB < 6 ? '1-2-3' : cB < 9 ? '1-3-6' : cB < 12 ? '1-5-9' : '1-6-12';
    document.querySelector(`#${char.id}-hand_main`).value = char.hand_main === '' ? 'Без оружия: ' + noWeaponDmg + ', Оглушение' : char.hand_main;
}

/** Заполняем навыки */
function displayCharSkills(char)
{
    const skillCont = document.querySelector(`#${char.id}-skills-cont`);
    skillCont.innerHTML = '<strong class="inner-header">Навыки</strong>';
    const skillTable = document.createElement('table');
    skillTable.id =char.id+"skills";
    skillTable.style.width = '100%';
    // skillTable.style.fontSize = '0.8rem';
    skillCont.appendChild(skillTable);
    // skillTable.createTHead().insertRow().innerHTML = `<th colspan="2">Навыки</th>`;
    const skBody = skillTable.createTBody();
    for (let [skillId, lvl] of Object.entries(char.skills).sort())
    {
        const skill = SKILLS[skillId];
        let skillBonus = skill.levels.length === 3 ? skill.levels[lvl-1] : SKILL_LEVELS_DEFAULT[lvl-1];
        skBody.insertRow().innerHTML = `
        <td style="font-weight: bold;">
            <span class="${attrClasses[skill.attr]}">●</span>&nbsp;
            <span id="${skillId}-name" style="border-bottom: 1px dashed var(--tocclr); cursor: default;">
            ${skill.name}&nbsp;${skillRanks[lvl-1]}</span>
        </td><td id="${skillId}-effect">${skillBonus}</td>`;
        skBody.rows.item(skBody.rows.length - 1).id = 'r-'+skillId;
        skBody.querySelector(`#${skillId}-name`).onmouseenter = (event) => { showSkillHint(event, skill) }
        skBody.querySelector(`#${skillId}-name`).onmouseleave = () => hideModal()

        switch(skillId)
        {
            case 'sm03': {
                skBody.querySelector(`#${skillId}-effect > span`).style.cssText = 'cursor: default; border-bottom: 1px dashed var(--tocclr)';
                skBody.querySelector(`#${skillId}-effect > span`).onmouseenter = (event) => { showPerfomance(event, lvl) }
                skBody.querySelector(`#${skillId}-effect > span`).onmouseleave = () => hideModal();
                break;
            }
            case 'sm04': {
                skBody.querySelector(`#${skillId}-effect > span`).style.cssText = 'cursor: default; border-bottom: 1px dashed var(--tocclr)';
                skBody.querySelector(`#${skillId}-effect > span`).onmouseenter = (event) => { showAlchemy(event, lvl) }
                skBody.querySelector(`#${skillId}-effect > span`).onmouseleave = () => hideModal();
                break;
            }
            case 'sm05': {
                skBody.querySelector(`#${skillId}-effect > span`).style.cssText = 'cursor: default; border-bottom: 1px dashed var(--tocclr)';
                skBody.querySelector(`#${skillId}-effect > span`).onmouseenter = (event) => { showRites(event, lvl) }
                skBody.querySelector(`#${skillId}-effect > span`).onmouseleave = () => hideModal();
                break;
            }
        }
    }
}

/** Заполняем магию */
function displayCharMagic(char)
{
    const magicCont = document.querySelector(`#${char.id}-magic-cont`);
    magicCont.innerHTML = '';
    if (char.magic.length > 0)
    {
        const magicTable = document.createElement('table');
        magicTable.style.width = '100%';
        magicTable.style.fontSize = '0.8rem';
        magicCont.appendChild(magicTable);
        const mtBody = magicTable.createTBody();
        for (let spell of char.magic.sort())
        {
            const spellData = SPELLS[spell];
            const arcLvl = char.skills[spellData.skill] - 1;
            let spellType = spellData.combat ? '⚔️' : '🗺️';
            let spellClass = spellData.instant ? '⚡' : '☄️';
            mtBody.insertRow().innerHTML = `
                <td><span class="arcanum ${spellArcana[spellData.skill]}">●</span>&nbsp;<span id="${spell}-name" style="border-bottom: 1px dashed var(--tocclr); cursor: default;">${spellData.name}&nbsp;${spellType}${spellClass}</span></td>
                <td><strong class="mind">[${spellData.cost}]</strong>&nbsp;${spellData.effects[arcLvl]}</td>`;
            mtBody.rows.item(mtBody.rows.length - 1).id = 'r-'+spell;
            mtBody.querySelector(`#${spell}-name`).onmouseenter = (event) => { showSpellHint(event, spellData) }
            mtBody.querySelector(`#${spell}-name`).onmouseleave = () => hideModal()
        }
    }
    else
    {
        const noMagicMsg = document.createElement('div');
        noMagicMsg.textContent = 'Нет известных заклинаний'
        magicCont.appendChild(noMagicMsg);
    }
    const newSpell = document.createElement('div');
    newSpell.style.cssText = 'margin-top: 0.5rem; display: flex; justify-content: end;';
    newSpell.innerHTML = '<button>Изучить</button>';
    newSpell.querySelector('button').addEventListener('click', () => {
        displayMagicScreen(char);
        document.querySelector('#magic-modal').scrollIntoView();
    });
    magicCont.appendChild(newSpell);
}

/** Вывести информацию о персонаже */
export function createChar(char, containerId)
{
    const charHeader = document.createElement('header');
    charHeader.innerHTML = `
    <div id="${char.id}-general">
        <strong class="char-name">${char.name}</strong>
        <div class="char-key">
            <span>Ключ:<span class="${attrClasses[char.key_attr]}"> ${attrNames[char.key_attr]}</span></span>
            <span style="display: flex; flex-wrap: wrap; flex: 1;">
                Опыт: <span id="${char.id}-xp" style="color: var(--hclr); margin-left: 0.2rem;">${char.xp}</span>/<span id="${char.id}-xp-total" style="color: var(--hclr);">${char.xp_total}</span>
                <button class="close xp" id="add-xp-btn" style="margin-left: 0.2rem;">${plusSVG}</button>
            </span>
        </div>
    </div>
    <div class="controls">
        <button id="char-train">Развитие</button>
        <button id="char-export-btn">Экспорт</button>
    </div>
    `
    document.querySelector('#'+containerId).appendChild(charHeader);

    const attrCss = 'flex-direction: row; justify-content: space-between;';
    const charParams = displayCharParams(char);

    const charBlock = document.createElement('div');
    charBlock.className = 'charsheet';
    charBlock.id = `char-${char.id}`;
    charBlock.innerHTML = `
        <aside>
            <div id="${char.id}-attrs" class="inner-block" style="${attrCss}">${charParams[0]}</div>
            <div id="${char.id}-stats" class="inner-block" style="${attrCss}">${charParams[1]}</div>
            <div id="${char.id}-equip" class="inner-block">
                <div class="equip-slot">
                    <div class="section-title">Основное оружие</div>
                    <textarea class="sheet" id="${char.id}-hand_main">${char.hand_main}</textarea>
                </div>
                <div class="equip-slot">
                    <div class="section-title">Доп. оружие/щит</div>
                    <textarea class="sheet" id="${char.id}-hand_off">${char.hand_off}</textarea>
                </div>
                <div class="equip-slot">
                    <div class="section-title">Облачение</div>
                    <textarea class="sheet" id="${char.id}-attire">${char.attire}</textarea>
                </div>
            </div>
        </aside>
        <main>
            <!-- Навыки -->
            <div class="inner-block headed" id="${char.id}-skills-cont"></div>

            <!-- Вкладки -->
            <div class="inner-block headed" style="flex: 1;">
                <div class="nav-wrapper inner-header">
                    <nav>
                        <button id="${char.id}-backpack-btn" class="tab active">Рюкзак</button>
                        <button id="${char.id}-magic-btn" class="tab">Магия</button>
                        <button id="${char.id}-lore-btn" class="tab">Знания</button>
                        <button id="${char.id}-notes-btn" class="tab">Заметки</button>
                        <button id="${char.id}-bio-btn" class="tab">Биография</button>
                    </nav>
                </div>
                <!-- Рюкзак -->
                <div class="tab-container" id="${char.id}-backpack-cont">
                    <textarea rows="10" class="sheet tab" id="${char.id}-backpack" style="height: calc(100% - 35px);">${char.backpack}</textarea>
                    <div style="display: flex; justify-content: end; align-items: center; gap: 0.25rem; margin-top: 0.25rem;">
                        <label for="${char.id}-money">Энары</label>
                        <input id="${char.id}-money" type="text" value="${sMon(char.money)}" size="6" style="font-weight: bold;">
                    </div>
                </div>
                <!-- Магия -->
                <div class="tab-container hidden" id="${char.id}-magic-cont"></div>
                <!-- Рецепты и ритуалы -->
                <div class="tab-container hidden" id="${char.id}-lore-cont">
                    <textarea rows="10" class="sheet tab" id="${char.id}-lore">${char.lore}</textarea>
                </div>
                <!-- Заметки -->
                <div class="tab-container hidden" id="${char.id}-notes-cont">
                    <textarea rows="10" class="sheet tab" id="${char.id}-notes">${char.notes}</textarea>
                </div>
                <!-- Био -->
                <div class="tab-container hidden" id="${char.id}-bio-cont">
                    <textarea rows="10" class="sheet tab" id="${char.id}-bio">${char.bio}</textarea>
                </div>
            </div>
        </main>`;
    document.querySelector('#'+containerId).appendChild(charBlock);

    /** Заполняем скиллы */
    displayCharSkills(char);

    /** Проверяем дамаг без оружия */
    checkUnarmedDmg(char);

    /** Заполняем магию */
    displayCharMagic(char);

    /** Автоматическое сохранение изменений в полях ввода */
    document.querySelectorAll('textarea').forEach((elem) => { elem.addEventListener('change', (event) => {
        char[event.target.id.split('-')[1]] = event.target.value; autoSaveChar(char);})
    });
    // Сохранение изменений в статах
    document.querySelectorAll('input.stat').forEach((elem) => { elem.addEventListener('change', (event) => {
        char.stats[event.target.id.split('-')[2]] = Number.parseInt(event.target.value); autoSaveChar(char);})
    });
    // Сохранение изменений в деньгах
    document.querySelector(`#${char.id}-money`).addEventListener('change', (event) => {
        // тут важно, что это неразрывный пробел ( , который Alt+0160)
        char.money = 1*event.target.value.replaceAll(/,/g, '.').replaceAll(/ /g, '');
        event.target.value = sMon(char.money);
        autoSaveChar(char);
    });

    /** Переключение вкладок листа персонажа */
    document.querySelectorAll('button.tab').forEach((btn) => {
        btn.addEventListener('click', (event) => {
        setActiveTab(event.target, event.target.id.split('-').slice(0, 2).join('-')+'-cont') })
    });

    /** Кнопка показа экрана прокачки */
    document.querySelector('#char-train').addEventListener('click', () => displayTrainScreen(char));
    document.querySelector('#reset-char-confirm').addEventListener('click', () => resetChar(char));

    /** Кнопка добавления экспы */
    document.querySelector('#add-xp-btn').onmouseenter = (event) => { showHint(event, 'Внести новые очки опыта') }
    document.querySelector('#add-xp-btn').onmouseleave = () => hideModal()
    document.querySelector('#add-xp-btn').addEventListener('click', () => displayAddXpScreen());
    document.querySelector('#add-xp-confirm').addEventListener('click', () => addNewXp(char));
    document.querySelector('#reset-xp-btn').addEventListener('click', () => displayResetXpScreen());
    document.querySelector('#reset-xp-confirm').addEventListener('click', () => resetXp(char));

    /** Экспорт кода персонажа */
    document.querySelector('#char-export-btn').addEventListener('click', () => showExportCode(char));
    document.querySelector('#export-copy').addEventListener('click', (event) => {
        navigator.clipboard.writeText(document.querySelector('#export-code').value)
        .then(() => {
            event.target.textContent = 'Успешно скопировано'
            event.target.style.cssText = 'background-color: #1b5e20; color: #fff;';
            setTimeout(() => {
                event.target.textContent = 'Скопировать';
                event.target.removeAttribute('style');
            }, 1000);
        })
        .catch(() => {
            event.target.textContent = 'Ошибка копирования'
            event.target.style.cssText = 'background-color: var(--dclr); color: #fff;';
            setTimeout(() => {
                event.target.textContent = 'Скопировать';
                event.target.removeAttribute('style');
            }, 1000);
        });
    });
    document.querySelector('#export-close').addEventListener('click', closeGlassModal);

    return charBlock
}

export function newChar(name, keyAttr, bio, legacy=null, showIntro=true)
{
    closeGlassModal();
    let oldChar = null;
    if (legacy)
    {
        try { oldChar = JSON.parse(LZUTF8.decompress(legacy, {'inputEncoding': 'Base64'})); }
        catch (e) { console.log(e); oldChar = null; }
    }
    let char = {};
    Object.assign(char, charTemplate);
    char.id = genCharId();
    char.name = name;
    char.key_attr = 1*keyAttr;
    char.bio = bio;
    char.xp = char.xp_total = oldChar ? oldChar.xp_total > 12 ? oldChar.xp_total - 1 : 12 : 12;
    char.money = oldChar ? Math.floor(oldChar.money / 2) : defaultMoney;
    autoSaveChar(char);
    createChar(char, 'charsheet-cont');
    if (showIntro) { displayIntroScreen(char); }
    else { displayTrainScreen(char); }
}

/** Сбросить видимость всех модальных экранов во избежание конфликтов */
function resetGlassModals()
{
    document.querySelectorAll('.glass-modal').forEach((elem) => { elem.classList.add('hidden'); });
}

/** Переключить активную вкладку */
function setActiveTab(caller, tabId)
{
    document.querySelectorAll('.tab').forEach((item) => { item.classList.remove('active'); });
    document.querySelectorAll('.tab-container').forEach((item) => { item.classList.add('hidden'); });
    document.querySelector('#'+tabId).classList.remove('hidden');
    caller.classList.add('active');
}

function autoSaveChar(char)
{
    const charCode = LZUTF8.compress(JSON.stringify(char), {'outputEncoding': 'Base64'});
    localStorage.setItem('yrmChar', charCode);
}

/** Показать код экспорта персонажа */
function showExportCode(char)
{
    document.querySelector('.glass-cover').classList.remove('hidden');
    document.querySelector('#export-modal').classList.remove('hidden');
    const charCode = LZUTF8.compress(JSON.stringify(char), {'outputEncoding': 'Base64'});
    document.querySelector('#export-code').value = charCode;
    renderCloseButton(document.querySelector('#export-close'));
}

/** Закрыть любой модальный экран */
export function closeGlassModal()
{
    document.querySelector('.glass-cover').classList.add('hidden');
    resetGlassModals();
}

/** Удобная функция для SVG-иконки кнопки закрытия */
export function renderCloseButton(buttonElem)
{
    buttonElem.innerHTML = closeSVG;
}

/** Удобная функция для SVG-иконки информации */
export function renderHelpElem(elem)
{
    elem.innerHTML = helpSVG;
}

/** Показать всплывающую подсказку */
export function showHint(event, message)
{
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.innerHTML = message;
    setModalPos(event.target, 2);
}

/** Показать подсказку об умениях */
function showSkillHint(event, skill)
{
    let skillBonus = skill.levels.length === 3 ? skill.levels : SKILL_LEVELS_DEFAULT;
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.style.cssText = 'display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem;'
    modal.innerHTML = `<strong>${skill.name}</strong><span>${skill.desc}</span>
    <strong>Связанный атрибут: <span class="${attrClasses[skill.attr]}">${attrNames[skill.attr]}</span></strong>
    <strong>Эффекты</strong>
    <div>
        <div><strong style="display: inline-block; text-align: end; min-width: 1rem;">I:</strong> ${skillBonus[0]}</div>
        <div><strong style="display: inline-block; text-align: end; min-width: 1rem;">II:</strong> ${skillBonus[1]}</div>
        <div><strong style="display: inline-block; text-align: end; min-width: 1rem;">III:</strong> ${skillBonus[2]}</div>
    </div>`;
    setModalPos(event.target, 2);
}

/** Показать подсказку о заклинании */
function showSpellHint(event, spell)
{
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.style.cssText = 'display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem;'
    modal.classList.add('arcanum');
    modal.classList.add(spellArcana[spell.skill]);
    modal.innerHTML = `<strong style="display: flex; justify-content: space-between;">
        <span class="spell-name ${spellArcana[spell.skill]}">${spell.name}</span>
        <span>${spell.combat ? '⚔️&nbsp;Боевое' : '🗺️&nbsp;Небоевое'}</span>
    </strong>
    <strong style="display: flex; justify-content: space-between;">
        <span>${SKILLS[spell.skill].name}</span>
        <span>${spell.instant ? '⚡&nbsp;Заклинание' : '☄️&nbsp;Колдовство'}</span>
    </strong>
    <strong style="display: flex; justify-content: space-between;">
        <span class="mind">Затраты Воли: ${spell.cost}</span>
        <span>Уровень: ${spell.level}</span>
    </strong>
    <span>${spell.desc}</span>
    <strong>Эффекты</strong>
    <div>
        <div><strong style="display: inline-block; text-align: end; min-width: 1rem;">I:</strong> ${spell.effects[0]}</div>
        <div><strong style="display: inline-block; text-align: end; min-width: 1rem;">II:</strong> ${spell.effects[1]}</div>
        <div><strong style="display: inline-block; text-align: end; min-width: 1rem;">III:</strong> ${spell.effects[2]}</div>
    </div>`;
    setModalPos(event.target, 2);
}

/** Всплывающая подсказка по доступным персонажу ритуалам */
function showRites(event, level=1)
{
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.style.cssText = 'display: grid; gap: 0.5rem; font-size: 0.7rem; max-width: 30rem; grid-template-columns: auto auto;'
    for (let rite of Object.values(TABLES.rites))
    {
        if (rite.level <= level)
        {
            modal.innerHTML += `<div style="display: flex; flex-direction: column; gap: 0.2rem;">
            <strong>🌀 ${rite.name} (ур. ${rite.level})</strong>
            <strong>Бросков на начертание рун: ${rite.level}</strong><span>${rite.desc}</span></div>`;
        }
    }
    setModalPos(event.target, 2);
}

/** Всплывающая подсказка по доступным персонажу рецептам зелий */
function showAlchemy(event, level=1)
{
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.style.cssText = 'display: grid; gap: 0.5rem; font-size: 0.7rem; max-width: 30rem; grid-template-columns: auto auto;'
    for (let potion of Object.values(TABLES.alchemy))
    {
        if (potion.level <= level)
        {
            let formula = '';
            for (let reagent of potion.formula)
            {
                switch (reagent)
                {
                    case 'W': formula += '🌊 Вода + '; break;
                    case 'A': formula += '🌪️ Воздух + '; break;
                    case 'F': formula += '🔥 Огонь + '; break;
                    case 'E': formula += '🌿 Земля + '; break;
                }
            }
            formula = formula.replace(/ \+ $/g, '');
            modal.innerHTML += `<div style="display: flex; flex-direction: column; gap: 0.2rem;">
            <strong>⚗️ ${potion.name} (ур. ${potion.level})</strong>
            <strong>${formula}</strong><span>${potion.desc}</span></div>`;
        }
    }
    setModalPos(event.target, 2);
}

/** Всплывающая подсказка по доступным персонажу ритуалам */
function showPerfomance(event, level=1)
{
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.style.cssText = 'display: grid; gap: 0.5rem; font-size: 0.7rem; max-width: 30rem; grid-template-columns: auto auto;'
    for (let warcry of Object.values(TABLES.perfomance))
    {
        if (warcry.level <= level)
        {
            modal.innerHTML += `<div style="display: flex; flex-direction: column; gap: 0.2rem;">
            <strong>🎸 ${warcry.name} (ур. ${warcry.level})</strong><span>${warcry.desc}</span></div>`;
        }
    }
    setModalPos(event.target, 2);
}

/** Скрыть модальное окно (всплывающую подсказку) */
export function hideModal()
{
    document.querySelector('#cs-hint-modal').className = 'modal hidden';
    document.querySelector('#cs-hint-modal').innerHTML = '';
    document.querySelector('#cs-hint-modal').removeAttribute('style');
}

/** Установить положение модального окна относительно элемента, его вызвавшего */
export function setModalPos(element, offsetY=2)
{
    const modal = document.querySelector('#cs-hint-modal');
    const coord = element.getBoundingClientRect();
    let topOffset = (coord.bottom + offsetY + modal.offsetHeight > window.innerHeight) ? 
        (coord.top - offsetY - modal.offsetHeight) : coord.bottom + offsetY
    modal.style.top = (topOffset + window.scrollY) + 'px'
    let leftOffset = (coord.left + modal.offsetWidth > window.innerWidth) ? 
        (coord.right - modal.offsetWidth) : coord.left;
    modal.style.left = leftOffset + 'px'
}
