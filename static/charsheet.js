const SKILLS = await fetch('https://mforv.github.io/yrmenfell/static/data/skills.json').then(resp => resp.json())
const SPELLS = await fetch('https://mforv.github.io/yrmenfell/static/data/spells.json').then(resp => resp.json())

export const attrClasses = ['body', 'mind', 'control']
const attrNames = ['Тело', 'Разум', 'Контроль']
const statShort = ['ЗДР', 'ВОЛ', 'ИНЦ']
const skillRanks = ['I', 'II', 'III']
const SKILL_LEVELS_DEFAULT = ["+2 при проверке", "+4 при проверке", "+6 при проверке"]
const spellOrigins = {
    "s31": "#f9a825",
    "s32": "#b71c1c",
    "s33": "#90a4ae",
    "s34": "#0d47a1",
    "s35": "#1b5e20"
}
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'

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
    "backpack": "",
    "money": 0,
    "bio": "",
    "notes": ""
}

const plusSVG = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="1em" height="1em" style="vertical-align: -0.125em;" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z" fill="currentColor"/></svg>'
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
    trainScreen.style.top = window.matchMedia("(max-width: 650px)").matches ? '7rem' : '4rem';

    if (trainScreen.querySelector('.inner-block.train'))
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
        const attrName = window.matchMedia("(max-width: 650px)").matches ? attrNames[attrId].slice(0, 3) : attrNames[attrId];
        const attrEntry = document.createElement('div');
        attrEntry.className = `attr-cell ${attrClasses[attrId]}`;
        attrEntry.style.cssText = "gap: 0.25rem; flex-direction: column;";
        attrEntry.innerHTML = `
            <div style="font-size: 1.5rem; font-weight: bold;">${char.attrs[attrId]} ${attrName}</div>
            <button id="${char.id}-attr-${attrId}-up-btn" ${upBtnState}>Повысить (${attrCost} XP)</button>`;
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
        if (curSkillLvl < 3)
        {
            let upBtnState = skillCost <= char.xp && char.attrs[skill.attr] >= attrMin ? '' : 'disabled';

            let skillUpText = char.attrs[skill.attr] >= attrMin ? `Приобрести (${skillCost} XP)`: 
                `треб. <span class="${attrClasses[skill.attr]}">${attrMin} ${attrNames[skill.attr].slice(0,3).toUpperCase()}</span>`;

            const skillUpEntry = document.createElement('div');
            skillUpEntry.className = 'char-up-entry';
            skillUpEntry.innerHTML = `
                <span class="${attrClasses[skill.attr]}">●</span> <span class="skill-name">${skill.name}&nbsp;${skillRanks[curSkillLvl]}</span>
                <button id="${skillId}-up-btn" ${upBtnState} style="margin-left: auto; min-width: 8rem;">${skillUpText}</button>`;
            skillUpEntry.querySelector('.skill-name').onmouseenter = (event) => {
                if (document.querySelector('#toggle-skill-info').checked) showSkillHint(event, skill);
            }
            skillUpEntry.querySelector('.skill-name').onmouseleave = () => hideModal()
            skillTable.appendChild(skillUpEntry);
            document.querySelector(`#${skillId}-up-btn`).addEventListener('click', () => levelUpSkill(char, skillId, skillCost));
        }
    }
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
    displayTrainScreen(char);
}

/** Поднять уровень навыка */
function levelUpSkill(char, skillId, skillCost)
{
    if (char.skills[skillId]) char.skills[skillId]++ 
    else char.skills[skillId] = 1;
    char.xp -= skillCost;
    autoSaveChar(char);
    document.querySelector(`#${char.id}-skills > tbody`).innerHTML = displayCharSkills(char);
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
    magicScreen.style.top = '4rem';

    if (magicScreen.querySelector('.char-up-table'))
    { magicScreen.removeChild(magicScreen.querySelector('.char-up-table'))}

    const spellTable = document.createElement('div');
    magicScreen.appendChild(spellTable);

    spellTable.className = "char-up-table";
    for (let [spellId, spell] of Object.entries(SPELLS))
    {
        if (!char.magic.includes(spellId))
        {
            const spellOrigin = spell.origin;
            let spellBuyText = `треб. ${SKILLS[spellOrigin].name} ${skillRanks[spell.level-1]}`;
            let spellBtnState = 'disabled';
            if (char.skills[spellOrigin])
            {
                if (char.skills[spellOrigin] >= spell.level)
                {
                    spellBuyText = 'Приобрести';
                    spellBtnState = '';
                }
            }
            const spellUpEntry = document.createElement('div');
            spellUpEntry.className = 'char-up-entry';
            spellUpEntry.innerHTML = `
                <span style="color: ${spellOrigins[spellOrigin]}">●</span> ${spell.name}
                <button id="${spellId}-buy-btn" ${spellBtnState} style="margin-left: auto; min-width: 11rem;">${spellBuyText}</button>`;
            spellTable.appendChild(spellUpEntry);
            document.querySelector(`#${spellId}-buy-btn`).addEventListener('click', () => {
                char.magic.push(spellId);
                autoSaveChar(char);
                displayCharMagic(char);
                displayMagicScreen(char);
            });
        }
    }
    if (!spellTable.firstChild)
    {
        const noMagicMsg = document.createElement('div');
        noMagicMsg.textContent = 'Нет доступных заклинаний и ритуалов'
        spellTable.appendChild(noMagicMsg);
    }
}

/** Окно добавления XP */
function displayAddXpScreen(char)
{
    document.querySelector('.glass-cover').classList.remove('hidden');
    const magicScreen = document.querySelector('#add-xp-modal');

    renderCloseButton(document.querySelector('#add-xp-close'));
    document.querySelector('#add-xp-close').addEventListener('click', closeGlassModal);
    
    magicScreen.classList.remove('hidden');
    magicScreen.style.top = '4rem';
}

/** Обработка нового опыта */
function addNewXp(char)
{
    const newXp = Number.parseInt(document.querySelector('#add-xp-input').value);
    char.xp += newXp;
    char.xp_total += newXp;
    document.querySelector(`#${char.id}-xp`).textContent = char.xp;
    document.querySelector(`#${char.id}-xp-total`).textContent = char.xp_total;
    autoSaveChar(char);
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

/** Заполняем навыки */
function displayCharSkills(char)
{
    let skillData = '';
    for (let [skillId, lvl] of Object.entries(char.skills))
    {
        const skill = SKILLS[skillId];
        let skillBonus = skill.levels.length === 3 ? skill.levels[lvl-1] : SKILL_LEVELS_DEFAULT[lvl-1];
        skillData += `
            <tr>
                <td style="font-weight: bold;">
                    <span class="${attrClasses[skill.attr]}">●</span>
                    ${skill.name} ${skillRanks[lvl-1]}
                </td>
                <td>${skillBonus}</td>
            </tr>`;
    }
    return skillData;
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
        const mtBody = document.createElement('tbody');
        magicTable.appendChild(mtBody);
        magicCont.appendChild(magicTable);
        for (let spell of char.magic)
        {
            const spellData = SPELLS[spell];
            let spellEntry = document.createElement('tr');
            spellEntry.innerHTML = `<td><span style="color: ${spellOrigins[spellData.origin]}">●</span>
                ${spellData.name}</td><td>${spellData.level}</td><td>${spellData.cost}</td>`;
            mtBody.appendChild(spellEntry);
        }
    }
    else
    {
        const noMagicMsg = document.createElement('div');
        noMagicMsg.textContent = 'Нет известных заклинаний и ритуалов'
        magicCont.appendChild(noMagicMsg);
    }
    const newSpell = document.createElement('div');
    newSpell.style.cssText = 'margin-top: 0.5rem; display: flex; justify-content: end;';
    newSpell.innerHTML = '<button>Добавить</button>';
    newSpell.addEventListener('click', () => displayMagicScreen(char));
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
    <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; align-self: center; justify-content: end; margin-left: auto;">
        <button style="flex: 1;" id="char-train">Развитие</button>
        <button style="flex: 1;" id="char-export-btn">Экспорт</button>
    </div>
    `
    document.querySelector('#'+containerId).appendChild(charHeader);

    const attrCss = 'flex-direction: row; justify-content: space-between;';
    const charParams = displayCharParams(char);

    const charBlock = document.createElement('div');
    charBlock.className = 'charsheet';
    charBlock.id = `char-${char.id}`;
    charBlock.innerHTML = `
        <aside style="display: flex; gap: 0.5rem; flex-direction: column;">
            <div id="${char.id}-attrs" class="inner-block" style="${attrCss}">${charParams[0]}</div>
            <div id="${char.id}-stats" class="inner-block" style="${attrCss}">${charParams[1]}</div>
            <div id="${char.id}-equip" class="inner-block">
                <div class="equip-slot">
                    <div class="section-title">Основное оружие</div>
                    <textarea rows="2" class="sheet" id="${char.id}-hand_main">${char.hand_main}</textarea>
                </div>
                <div class="equip-slot">
                    <div class="section-title">Вспомогательное оружие</div>
                    <textarea rows="2" class="sheet" id="${char.id}-hand_off">${char.hand_off}</textarea>
                </div>
                <div class="equip-slot">
                    <div class="section-title">Облачение</div>
                    <textarea rows="2" class="sheet" id="${char.id}-attire">${char.attire}</textarea>
                </div>
            </div>
        </aside>
        <main style="display: flex; gap: 0.5rem; flex-direction: column;">
            <!-- Навыки -->
            <div class="inner-block">
                <table id="${char.id}-skills">
                    <thead><tr><th colspan="2">Навыки</th></tr></thead>
                    <tbody>${displayCharSkills(char)}</tbody>
                </table>
            </div>

            <!-- Вкладки -->
            <div class="inner-block" style="flex: 1;">
                <div style="display: flex; gap: 0.25rem; border-bottom: 2px solid var(--hclr);">
                    <button id="${char.id}-backpack-btn" class="tab active">Рюкзак</button>
                    <button id="${char.id}-magic-btn" class="tab">Магия</button>
                    <button id="${char.id}-notes-btn" class="tab">Заметки</button>
                    <button id="${char.id}-bio-btn" class="tab">Биография</button>
                </div>
                <div class="tab-container" id="${char.id}-backpack-cont">
                    <textarea rows="10" class="sheet tab" id="${char.id}-backpack" style="height: calc(100% - 35px);">${char.backpack}</textarea>
                    <div style="display: flex; justify-content: end; align-items: center; gap: 0.25rem; margin-top: 0.25rem;">
                        <label for="${char.id}-money">Кристаллы</label>
                        <input id="${char.id}-money" type="text" value="${sMon(char.money)}" size="6" style="font-weight: bold;">
                    </div>
                </div>
                <div class="tab-container hidden" id="${char.id}-magic-cont"></div>
                <div class="tab-container hidden" id="${char.id}-notes-cont">
                    <textarea rows="10" class="sheet tab" id="${char.id}-notes">${char.notes}</textarea>
                </div>
                <div class="tab-container hidden" id="${char.id}-bio-cont">
                    <textarea rows="10" class="sheet tab" id="${char.id}-bio">${char.bio}</textarea>
                </div>
            </div>
        </main>`;
    document.querySelector('#'+containerId).appendChild(charBlock);

    /** Заполняем магию */
    displayCharMagic(char);

    /** Автоматическое сохранение изменений в полях ввода */
    document.querySelectorAll('textarea').forEach((elem) => { elem.addEventListener('change', (event) => {
        char[event.target.id.split('-')[1]] = event.target.value; autoSaveChar(char);})
    });
    document.querySelectorAll('input.stat').forEach((elem) => { elem.addEventListener('change', (event) => {
        char.stats[event.target.id.split('-')[2]] = Number.parseInt(event.target.value); autoSaveChar(char);})
    });
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
    
    /** Кнопка добавления экспы */
    document.querySelector('#add-xp-btn').onmouseenter = (event) => { showHint(event, 'Внести новые очки опыта') }
    document.querySelector('#add-xp-btn').onmouseleave = () => hideModal()
    document.querySelector('#add-xp-btn').addEventListener('click', () => displayAddXpScreen(char));
    document.querySelector('#add-xp-confirm').addEventListener('click', () => addNewXp(char));

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
            event.target.style.cssText = 'background-color: #b71c1c; color: #fff;';
            setTimeout(() => {
                event.target.textContent = 'Скопировать';
                event.target.removeAttribute('style');
            }, 1000);
        });
    });
    document.querySelector('#export-close').addEventListener('click', closeGlassModal);

    return charBlock
}

export function newChar(name, keyAttr, bio, legacy=null)
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
    char.xp = char.xp_total = oldChar ? oldChar.xp_total - 1 : 12;
    char.money = oldChar ? Math.floor(oldChar.money / 2) : 2000;
    autoSaveChar(char);
    createChar(char, 'charsheet-cont');
    displayTrainScreen(char);
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

/** Показать всплывающую подсказку */
function showHint(event, message)
{
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.textContent = message;
    setModalPos(event.target, 2);
}

/** Показать подсказку об умениях */
function showSkillHint(event, skill)
{
    const modal = document.querySelector('#cs-hint-modal');
    modal.classList.remove('hidden');
    modal.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem;'
    modal.innerHTML = `<span>Атрибут: <span>${attrNames[skill.attr]}</span></span>`;
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
