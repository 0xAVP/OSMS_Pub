import {CONFIG} from '../../core/config.js';

export function preloadHangar() {

    this.load.image('hangar-bg', '/assets/images/scenes/hangar/hangar_bg.jpg');

    this.load.image('arrowR', '/assets/images/scenes/hangar/ship_arrowR.png');
    this.load.image('arrowL', '/assets/images/scenes/hangar/ship_arrowL.png');
    this.load.image('panel_arrowR', '/assets/images/scenes/hangar/panel_arrowR.png');
    this.load.image('panel_arrowL', '/assets/images/scenes/hangar/panel_arrowL.png');
    this.load.image('ship_select_bg', '/assets/images/scenes/hangar/ship_select_bg.png');
    this.load.image('slider_thumb', '/assets/images/slider_thumb.png');

    this.load.image('close_btn', '/assets/images/scenes/hangar/close_btn.png');
    this.load.image('collect', '/assets/images/scenes/hangar/buttons/collect.png');
    this.load.image('cancel', '/assets/images/scenes/hangar/buttons/cancel.png');
    this.load.image('send', '/assets/images/scenes/hangar/buttons/send.png');
    this.load.image('use', '/assets/images/scenes/hangar/buttons/use.png');
    this.load.image('craft', '/assets/images/scenes/hangar/buttons/craft.png');
    this.load.image('mint', '/assets/images/scenes/hangar/buttons/mint.png');
    this.load.image('upgrade', '/assets/images/scenes/hangar/buttons/upgrade.png');
    this.load.image('confirm', '/assets/images/scenes/hangar/buttons/confirm.png');
    this.load.image('change_module', '/assets/images/scenes/hangar/upgrade/change_module.png');
    this.load.image('install', '/assets/images/scenes/hangar/buttons/install.png');
    this.load.image('dismantle', '/assets/images/scenes/hangar/buttons/dismantle.png');
    this.load.image('claim', '/assets/images/scenes/hangar/buttons/claim.png');
    this.load.image('delete', '/assets/images/scenes/hangar/buttons/delete.png');
    this.load.image('s_rewards', '/assets/images/scenes/hangar/buttons/s_rewards.png');
    this.load.image('copy', '/assets/images/scenes/hangar/buttons/copy.png');

    this.load.image('ic_pilot@1x', '/assets/images/scenes/hangar/nav_top/icon_pilot.png');
    this.load.image('ic_pilot@0.75x', '/assets/images/scenes/hangar/nav_top/icon_pilot@0,75x.png');
    this.load.image('ic_pilot@0.5x', '/assets/images/scenes/hangar/nav_top/icon_pilot@0,5x.png');
    this.load.image('ic_pilot@@.25x', '/assets/images/scenes/hangar/nav_top/icon_pilot@0,25x.png');

    this.load.image('ic_account@1x', '/assets/images/scenes/hangar/nav_top/icon_account.png');
    this.load.image('ic_account@0.75x', '/assets/images/scenes/hangar/nav_top/icon_account@0,75x.png');
    this.load.image('ic_account@0.5x', '/assets/images/scenes/hangar/nav_top/icon_account@0,5x.png');
    this.load.image('ic_account@@.25x', '/assets/images/scenes/hangar/nav_top/icon_account@0,25x.png');

    this.load.image('ic_inventory@1x', '/assets/images/scenes/hangar/nav_top/icon_inv.png');
    this.load.image('ic_inventory@0.75x', '/assets/images/scenes/hangar/nav_top/icon_inv@0,75x.png');
    this.load.image('ic_inventory@0.5x', '/assets/images/scenes/hangar/nav_top/icon_inv@0,5x.png');
    this.load.image('ic_inventory@@.25x', '/assets/images/scenes/hangar/nav_top/icon_inv@0,25x.png');

    this.load.image('ic_craft@1x', '/assets/images/scenes/hangar/nav_top/icon_craft.png');
    this.load.image('ic_craft@0.75x', '/assets/images/scenes/hangar/nav_top/icon_craft@0,75x.png');
    this.load.image('ic_craft@0.5x', '/assets/images/scenes/hangar/nav_top/icon_craft@0,5x.png');
    this.load.image('ic_craft@@.25x', '/assets/images/scenes/hangar/nav_top/icon_craft@0,25x.png');

    this.load.image('ic_market@1x', '/assets/images/scenes/hangar/nav_top/icon_market.png');
    this.load.image('ic_market@0.75x', '/assets/images/scenes/hangar/nav_top/icon_market@0,75x.png');
    this.load.image('ic_market@0.5x', '/assets/images/scenes/hangar/nav_top/icon_market@0,5x.png');
    this.load.image('ic_market@@.25x', '/assets/images/scenes/hangar/nav_top/icon_market@0,25x.png');

    this.load.image('ic_upgrade@1x', '/assets/images/scenes/hangar/nav_top/icon_upgrade.png');
    this.load.image('ic_upgrade@0.75x', '/assets/images/scenes/hangar/nav_top/icon_upgrade@0,75x.png');
    this.load.image('ic_upgrade@0.5x', '/assets/images/scenes/hangar/nav_top/icon_upgrade@0,5x.png');
    this.load.image('ic_upgrade@@.25x', '/assets/images/scenes/hangar/nav_top/icon_upgrade@0,25x.png');

    this.load.image('ic_mail@1x', '/assets/images/scenes/hangar/nav_top/icon_mail.png');
    this.load.image('ic_mail@0.75x', '/assets/images/scenes/hangar/nav_top/icon_mail@0,75x.png');
    this.load.image('ic_mail@0.5x', '/assets/images/scenes/hangar/nav_top/icon_mail@0,5x.png');
    this.load.image('ic_mail@@.25x', '/assets/images/scenes/hangar/nav_top/icon_mail@0,25x.png');

    this.load.image('ic_ship@1x', '/assets/images/scenes/hangar/nav_top/icon_ship.png');
    this.load.image('ic_ship@0.75x', '/assets/images/scenes/hangar/nav_top/icon_ship@0,75x.png');
    this.load.image('ic_ship@0.5x', '/assets/images/scenes/hangar/nav_top/icon_ship@0,5x.png');
    this.load.image('ic_ship@@.25x', '/assets/images/scenes/hangar/nav_top/icon_ship@0,25x.png');

    this.load.image('ic_leaderboard@1x', '/assets/images/scenes/hangar/nav_top/icon_leaderboard.png');
    this.load.image('ic_leaderboard@0.75x', '/assets/images/scenes/hangar/nav_top/icon_leaderboard@0,75x.png');
    this.load.image('ic_leaderboard@0.5x', '/assets/images/scenes/hangar/nav_top/icon_leaderboard@0,5x.png');
    this.load.image('ic_leaderboard@@.25x', '/assets/images/scenes/hangar/nav_top/icon_leaderboard@0,25x.png');

    this.load.image('desk@1x', '/assets/images/scenes/hangar/nav_bottom/desk.png');
    this.load.image('desk@0.75x', '/assets/images/scenes/hangar/nav_bottom/desk@0,75x.png');
    this.load.image('desk@0.5x', '/assets/images/scenes/hangar/nav_bottom/desk@0,5x.png');
    this.load.image('desk@0.25x', '/assets/images/scenes/hangar/nav_bottom/desk@0,25x.png');

    this.load.image('start_game_btn@1x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn.png');
    this.load.image('start_game_btn@0.75x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn@0,75x.png');
    this.load.image('start_game_btn@0.5x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn@0,5x.png');
    this.load.image('start_game_btn@0.25x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn@0,25x.png');
    this.load.image('start_game_btn_active@1x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn_active.png');
    this.load.image('start_game_btn_active@0.75x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn_active@0,75x.png');
    this.load.image('start_game_btn_active@0.5x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn_active@0,5x.png');
    this.load.image('start_game_btn_active@0.25x', '/assets/images/scenes/hangar/nav_bottom/start_game_btn_active@0,25x.png');

    this.load.image('add_ship_btn@1x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn.png');
    this.load.image('add_ship_btn@0.75x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn@0,75x.png');
    this.load.image('add_ship_btn@0.5x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn@0,5x.png');
    this.load.image('add_ship_btn@0.25x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn@0,25x.png');
    this.load.image('add_ship_btn_active@1x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn_active.png');
    this.load.image('add_ship_btn_active@0.75x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn_active@0,75x.png');
    this.load.image('add_ship_btn_active@0.5x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn_active@0,5x.png');
    this.load.image('add_ship_btn_active@0.25x', '/assets/images/scenes/hangar/nav_bottom/add_ship_btn_active@0,25x.png');

    this.load.image('sw_screen_btn@1x', '/assets/images/scenes/hangar/nav_bottom/sw_screen_btn.png');
    this.load.image('sw_screen_btn@0.75x', '/assets/images/scenes/hangar/nav_bottom/sw_screen_btn@0,75x.png');
    this.load.image('sw_screen_btn@0.5x', '/assets/images/scenes/hangar/nav_bottom/sw_screen_btn@0,5x.png');
    this.load.image('sw_screen_btn@0.25x', '/assets/images/scenes/hangar/nav_bottom/sw_screen_btn@0,25x.png');

    this.load.image('sw_sound_btn@1x', '/assets/images/scenes/hangar/nav_bottom/sw_sound_btn.png');
    this.load.image('sw_sound_btn@0.75x', '/assets/images/scenes/hangar/nav_bottom/sw_sound_btn@0,75x.png');
    this.load.image('sw_sound_btn@0.5x', '/assets/images/scenes/hangar/nav_bottom/sw_sound_btn@0,5x.png');
    this.load.image('sw_sound_btn@0.25x', '/assets/images/scenes/hangar/nav_bottom/sw_sound_btn@0,25x.png');

    this.load.image('easy_mode_btn@1x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn.png');
    this.load.image('easy_mode_btn@0.75x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn@0,75x.png');
    this.load.image('easy_mode_btn@0.5x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn@0,5x.png');
    this.load.image('easy_mode_btn@0.25x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn@0,25x.png');

    this.load.image('easy_mode_btn_active@1x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn_active.png');
    this.load.image('easy_mode_btn_active@0.75x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn_active@0,75x.png');
    this.load.image('easy_mode_btn_active@0.5x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn_active@0,5x.png');
    this.load.image('easy_mode_btn_active@0.25x', '/assets/images/scenes/hangar/nav_bottom/easy_mode_btn_active@0,25x.png');

    this.load.image('medium_mode_btn@1x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn.png');
    this.load.image('medium_mode_btn@0.75x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn@0,75x.png');
    this.load.image('medium_mode_btn@0.5x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn@0,5x.png');
    this.load.image('medium_mode_btn@0.25x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn@0,25x.png');

    this.load.image('medium_mode_btn_active@1x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn_active.png');
    this.load.image('medium_mode_btn_active@0.75x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn_active@0,75x.png');
    this.load.image('medium_mode_btn_active@0.5x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn_active@0,5x.png');
    this.load.image('medium_mode_btn_active@0.25x', '/assets/images/scenes/hangar/nav_bottom/medium_mode_btn_active@0,25x.png');

    this.load.image('hard_mode_btn@1x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn.png');
    this.load.image('hard_mode_btn@0.75x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn@0,75x.png');
    this.load.image('hard_mode_btn@0.5x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn@0,5x.png');
    this.load.image('hard_mode_btn@0.25x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn@0,25x.png');

    this.load.image('hard_mode_btn_active@1x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn_active.png');
    this.load.image('hard_mode_btn_active@0.75x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn_active@0,75x.png');
    this.load.image('hard_mode_btn_active@0.5x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn_active@0,5x.png');
    this.load.image('hard_mode_btn_active@0.25x', '/assets/images/scenes/hangar/nav_bottom/hard_mode_btn_active@0,25x.png');

    this.load.image('icon_fuel@1x', '/assets/images/scenes/hangar/nav_bottom/icon_fuel.png');
    this.load.image('icon_fuel@0.75x', '/assets/images/scenes/hangar/nav_bottom/icon_fuel@0,75x.png');
    this.load.image('icon_fuel@0.5x', '/assets/images/scenes/hangar/nav_bottom/icon_fuel@0,5x.png');
    this.load.image('icon_fuel@0.25x', '/assets/images/scenes/hangar/nav_bottom/icon_fuel@0,25x.png');

    this.load.image('icon_exp@1x', '/assets/images/scenes/hangar/nav_bottom/icon_exp.png');
    this.load.image('icon_exp@0.75x', '/assets/images/scenes/hangar/nav_bottom/icon_exp@0,75x.png');
    this.load.image('icon_exp@0.5x', '/assets/images/scenes/hangar/nav_bottom/icon_exp@0,5x.png');
    this.load.image('icon_exp@0.25x', '/assets/images/scenes/hangar/nav_bottom/icon_exp@0,25x.png');

    this.load.image('empty_card_pilot', '/assets/images/scenes/hangar/inventory/empty_card_pilot.png');
    this.load.image('card_pilot', '/assets/images/scenes/hangar/inventory/card_pilot.png');
    this.load.image('amount_btn', '/assets/images/scenes/hangar/inventory/amount_btn.png');
    this.load.image('empty_card_item', '/assets/images/scenes/hangar/inventory/empty_card_item.png');
    this.load.image('card_item', '/assets/images/scenes/hangar/inventory/card_item.png');

    this.load.image('factory_line_item_bg@1x', '/assets/images/scenes/hangar/craft/factory_line_item_bg.png');
    this.load.image('factory_line_item_bg@0.75x', '/assets/images/scenes/hangar/craft/factory_line_item_bg@0,75x.png');
    this.load.image('factory_line_item_bg@0.5x', '/assets/images/scenes/hangar/craft/factory_line_item_bg@0,5x.png');
    this.load.image('factory_line_item_bg@0.25', '/assets/images/scenes/hangar/craft/factory_line_item_bg@0,25x.png');
    this.load.image('ic_time@1x', '/assets/images/scenes/hangar/icons/icon_clock.png');
    this.load.image('ic_time@0.75x', '/assets/images/scenes/hangar/icons/icon_clock@0,75x.png');
    this.load.image('ic_time@0.5x', '/assets/images/scenes/hangar/icons/icon_clock@0,5x.png');
    this.load.image('ic_time@0.25x', '/assets/images/scenes/hangar/icons/icon_clock@0,25x.png');
    this.load.image('osms_token@1x', '/assets/images/scenes/hangar/icons/osms_token.png');
    this.load.image('osms_token@0.75x', '/assets/images/scenes/hangar/icons/osms_token@0,75x.png');
    this.load.image('osms_token@0.5x', '/assets/images/scenes/hangar/icons/osms_token@0,5x.png');
    this.load.image('osms_token@0.25x', '/assets/images/scenes/hangar/icons/osms_token@0,25x.png');

    this.load.image('icon_line_empty@1x', '/assets/images/scenes/hangar/craft/icon_line_empty.png');
    this.load.image('icon_line_empty@0.75x', '/assets/images/scenes/hangar/craft/icon_line_empty@0,75x.png');
    this.load.image('icon_line_empty@0.5x', '/assets/images/scenes/hangar/craft/icon_line_empty@0,5x.png');
    this.load.image('icon_line_empty@0.25', '/assets/images/scenes/hangar/craft/icon_line_empty@0,25x.png');

    this.load.image('upgrade_item_bg', '/assets/images/scenes/hangar/craft/factory_line_item_bg.png');

    this.load.image('sort_all_active', '/assets/images/scenes/hangar/inventory/icon_all_active.png');
    this.load.image('sort_all_no_active', '/assets/images/scenes/hangar/inventory/icon_all_no_active.png');
    this.load.image('sort_modules_active', '/assets/images/scenes/hangar/inventory/icon_modules_active.png');
    this.load.image('sort_modules_no_active', '/assets/images/scenes/hangar/inventory/icon_modules_no_active.png');
    this.load.image('sort_resources_active', '/assets/images/scenes/hangar/inventory/icon_resources_active.png');
    this.load.image('sort_resources_no_active', '/assets/images/scenes/hangar/inventory/icon_resources_no_active.png');
    this.load.image('sort_blueprints_active', '/assets/images/scenes/hangar/inventory/icon_blueprints_active.png');
    this.load.image('sort_blueprints_no_active', '/assets/images/scenes/hangar/inventory/icon_blueprints_no_active.png');
    this.load.image('sort_stagestones_active', '/assets/images/scenes/hangar/inventory/icon_stagestones_active.png');
    this.load.image('sort_stagestones_no_active', '/assets/images/scenes/hangar/inventory/icon_stagestones_no_active.png');
    this.load.image('sort_components_active', '/assets/images/scenes/hangar/inventory/icon_components_active.png');
    this.load.image('sort_components_no_active', '/assets/images/scenes/hangar/inventory/icon_components_no_active.png');
    this.load.image('sort_hulls_active', '/assets/images/scenes/hangar/inventory/icon_hulls_active.png');
    this.load.image('sort_hulls_no_active', '/assets/images/scenes/hangar/inventory/icon_hulls_no_active.png');
    this.load.image('sort_other_active', '/assets/images/scenes/hangar/inventory/icon_other_active.png');
    this.load.image('sort_other_no_active', '/assets/images/scenes/hangar/inventory/icon_other_no_active.png');
    this.load.image('sort_armor_active', '/assets/images/scenes/hangar/icons/icon_armor_active.png');
    this.load.image('sort_armor_no_active', '/assets/images/scenes/hangar/icons/icon_armor_no_active.png');
    this.load.image('sort_engine_active', '/assets/images/scenes/hangar/icons/icon_engine_active.png');
    this.load.image('sort_engine_no_active', '/assets/images/scenes/hangar/icons/icon_engine_no_active.png');
    this.load.image('sort_extra_active', '/assets/images/scenes/hangar/icons/icon_extra_active.png');
    this.load.image('sort_extra_no_active', '/assets/images/scenes/hangar/icons/icon_extra_no_active.png');
    this.load.image('sort_shield_active', '/assets/images/scenes/hangar/icons/icon_shield_active.png');
    this.load.image('sort_shield_no_active', '/assets/images/scenes/hangar/icons/icon_shield_no_active.png');
    this.load.image('sort_weapon_active', '/assets/images/scenes/hangar/icons/icon_weapon_active.png');
    this.load.image('sort_weapon_no_active', '/assets/images/scenes/hangar/icons/icon_weapon_no_active.png');

    for (let id = 0; id < CONFIG.client.hangar.MAX_PILOTS_TO_PRELOAD; id++) {
        this.load.image(`pilot-${id}@1x`, `/assets/images/scenes/hangar/pilots/pilot-${id}.png`);
        this.load.image(`pilot-${id}@0.75x`, `/assets/images/scenes/hangar/pilots/pilot-${id}@0,75x.png`);
        this.load.image(`pilot-${id}@0.5x`, `/assets/images/scenes/hangar/pilots/pilot-${id}@0,5x.png`);
        this.load.image(`pilot-${id}@0.25x`, `/assets/images/scenes/hangar/pilots/pilot-${id}@0,25x.png`);
    }

    this.load.image('Nebular@1x', '/assets/images/scenes/hangar/ships/nebular.png');
    this.load.image('Nebular@0.75x', '/assets/images/scenes/hangar/ships/nebular@0,75x.png');
    this.load.image('Nebular@0.5x', '/assets/images/scenes/hangar/ships/nebular@0,5x.png');
    this.load.image('Nebular@0.25x', '/assets/images/scenes/hangar/ships/nebular@0,25x.png');

    this.load.image('Horizon@1x', '/assets/images/scenes/hangar/ships/horizon.png');
    this.load.image('Horizon@0.75x', '/assets/images/scenes/hangar/ships/horizon@0,75x.png');
    this.load.image('Horizon@0.5x', '/assets/images/scenes/hangar/ships/horizon@0,5x.png');
    this.load.image('Horizon@0.25x', '/assets/images/scenes/hangar/ships/horizon@0,25x.png');

    this.load.image('Guardian@1x', '/assets/images/scenes/hangar/ships/guardian.png');
    this.load.image('Guardian@0.75x', '/assets/images/scenes/hangar/ships/guardian@0,75x.png');
    this.load.image('Guardian@0.5x', '/assets/images/scenes/hangar/ships/guardian@0,5x.png');
    this.load.image('Guardian@0.25x', '/assets/images/scenes/hangar/ships/guardian@0,25x.png');

    this.load.image('Hypercon@1x', '/assets/images/scenes/hangar/ships/hypercon.png');
    this.load.image('Hypercon@0.75x', '/assets/images/scenes/hangar/ships/hypercon@0,75x.png');
    this.load.image('Hypercon@0.5x', '/assets/images/scenes/hangar/ships/hypercon@0,5x.png');
    this.load.image('Hypercon@0.25x', '/assets/images/scenes/hangar/ships/hypercon@0,25x.png');

    this.load.image('Cerberus@1x', '/assets/images/scenes/hangar/ships/cerberus.png');
    this.load.image('Cerberus@0.75x', '/assets/images/scenes/hangar/ships/cerberus@0,75x.png');
    this.load.image('Cerberus@0.5x', '/assets/images/scenes/hangar/ships/cerberus@0,5x.png');
    this.load.image('Cerberus@0.25x', '/assets/images/scenes/hangar/ships/cerberus@0,25x.png');

    this.load.image('Scopus@1x', '/assets/images/scenes/hangar/ships/scopus.png');
    this.load.image('Scopus@0.75x', '/assets/images/scenes/hangar/ships/scopus@0,75x.png');
    this.load.image('Scopus@0.5x', '/assets/images/scenes/hangar/ships/scopus@0,5x.png');
    this.load.image('Scopus@0.25x', '/assets/images/scenes/hangar/ships/scopus@0,25x.png');

    this.load.image('Leviathan@1x', '/assets/images/scenes/hangar/ships/leviathan.png');
    this.load.image('Leviathan@0.75x', '/assets/images/scenes/hangar/ships/leviathan@0,75x.png');
    this.load.image('Leviathan@0.5x', '/assets/images/scenes/hangar/ships/leviathan@0,5x.png');
    this.load.image('Leviathan@0.25x', '/assets/images/scenes/hangar/ships/leviathan@0,25x.png');

    this.load.image('Celestial@1x', '/assets/images/scenes/hangar/ships/celestial.png');
    this.load.image('Celestial@0.75x', '/assets/images/scenes/hangar/ships/celestial@0,75x.png');
    this.load.image('Celestial@0.5x', '/assets/images/scenes/hangar/ships/celestial@0,5x.png');
    this.load.image('Celestial@0.25x', '/assets/images/scenes/hangar/ships/celestial@0,25x.png');

    this.load.image('rookie_sign@1x', '/assets/images/scenes/hangar/modules/signs/common_sign.png');
    this.load.image('common_sign@1x', '/assets/images/scenes/hangar/modules/signs/common_sign.png');
    this.load.image('uncommon_sign@1x', '/assets/images/scenes/hangar/modules/signs/uncommon_sign.png');
    this.load.image('rare_sign@1x', '/assets/images/scenes/hangar/modules/signs/rare_sign.png');
    this.load.image('epic_sign@1x', '/assets/images/scenes/hangar/modules/signs/epic_sign.png');
    this.load.image('legendary_sign@1x', '/assets/images/scenes/hangar/modules/signs/legendary_sign.png');

    this.load.image('default_armor@1x', '/assets/images/scenes/hangar/modules/default/armor.png');
    this.load.image('default_armor@0.75x', '/assets/images/scenes/hangar/modules/default/armor@0,75x.png');
    this.load.image('default_armor@0.5x', '/assets/images/scenes/hangar/modules/default/armor@0,5x.png');
    this.load.image('default_armor@0.25x', '/assets/images/scenes/hangar/modules/default/armor@0,75x.png');
    this.load.image('default_engine@1x', '/assets/images/scenes/hangar/modules/default/engine.png');
    this.load.image('default_engine@0.75x', '/assets/images/scenes/hangar/modules/default/engine@0,75x.png');
    this.load.image('default_engine@0.5x', '/assets/images/scenes/hangar/modules/default/engine@0,5x.png');
    this.load.image('default_engine@0.25x', '/assets/images/scenes/hangar/modules/default/engine@0,75x.png');
    this.load.image('default_extra@1x', '/assets/images/scenes/hangar/modules/default/extra.png');
    this.load.image('default_extra@0.75x', '/assets/images/scenes/hangar/modules/default/extra@0,75x.png');
    this.load.image('default_extra@0.5x', '/assets/images/scenes/hangar/modules/default/extra@0,5x.png');
    this.load.image('default_extra@0.25x', '/assets/images/scenes/hangar/modules/default/extra@0,75x.png');
    this.load.image('default_shield@1x', '/assets/images/scenes/hangar/modules/default/shield.png');
    this.load.image('default_shield@0.75x', '/assets/images/scenes/hangar/modules/default/shield@0,75x.png');
    this.load.image('default_shield@0.5x', '/assets/images/scenes/hangar/modules/default/shield@0,5x.png');
    this.load.image('default_shield@0.25x', '/assets/images/scenes/hangar/modules/default/shield@0,75x.png');
    this.load.image('default_weapon@1x', '/assets/images/scenes/hangar/modules/default/weapon.png');
    this.load.image('default_weapon@0.75x', '/assets/images/scenes/hangar/modules/default/weapon@0,75x.png');
    this.load.image('default_weapon@0.5x', '/assets/images/scenes/hangar/modules/default/weapon@0,5x.png');
    this.load.image('default_weapon@0.25x', '/assets/images/scenes/hangar/modules/default/weapon@0,75x.png');

    this.load.image('rookie_cannon@1x', '/assets/images/scenes/hangar/modules/weapon/rookie_cannon.png');
    this.load.image('rookie_armor@1x', '/assets/images/scenes/hangar/modules/armor/rookie_armor.png');
    this.load.image('rookie_shield@1x', '/assets/images/scenes/hangar/modules/shield/rookie_shield.png');
    this.load.image('rookie_engine@1x', '/assets/images/scenes/hangar/modules/engine/rookie_engine.png');

    const moduleBaseNames = [
        {name: 'pulse_blaster', path: 'weapon'},
        {name: 'pulse_shotgun', path: 'weapon'},
        {name: 'pulse_piercer', path: 'weapon'},
        {name: 'energy_shield', path: 'shield'},
        {name: 'aegis_shield', path: 'shield'},
        {name: 'flux_shield', path: 'shield'},
        {name: 'kinetic_armor', path: 'armor'},
        {name: 'ablative_armor', path: 'armor'},
        {name: 'reactive_armor', path: 'armor'},
        {name: 'ion_thruster', path: 'engine'}
    ];

    const moduleScales = ['1x', '0.5x'];

    moduleBaseNames.forEach(mod => {
        moduleScales.forEach(scale => {

            this.load.image(
                `${mod.name}@${scale}`,
                `/assets/images/scenes/hangar/modules/${mod.path}/${mod.name}@${scale}.png`
            );
        });
    });

    this.load.image('zerion_gem@1x', '/assets/images/scenes/shared/resources/zerion_gem.png');
    this.load.image('zerion_gem@0.5x', '/assets/images/scenes/shared/resources/zerion_gem@0,5x.png');
    this.load.image('voltaic_cell@1x', '/assets/images/scenes/shared/resources/voltaic_cell.png');
    this.load.image('voltaic_cell@0.5x', '/assets/images/scenes/shared/resources/voltaic_cell@0,5x.png');
    this.load.image('void_pearl@1x', '/assets/images/scenes/shared/resources/void_pearl.png');
    this.load.image('void_pearl@0.5x', '/assets/images/scenes/shared/resources/void_pearl@0,5x.png');
    this.load.image('verdanite_shard@1x', '/assets/images/scenes/shared/resources/verdanite_shard.png');
    this.load.image('verdanite_shard@0.5x', '/assets/images/scenes/shared/resources/verdanite_shard@0,5x.png');
    this.load.image('solurnite_capsule@1x', '/assets/images/scenes/shared/resources/solurnite_capsule.png');
    this.load.image('solurnite_capsule@0.5x', '/assets/images/scenes/shared/resources/solurnite_capsule@0,5x.png');
    this.load.image('solar_pyrite@1x', '/assets/images/scenes/shared/resources/solar_pyrite.png');
    this.load.image('solar_pyrite@0.5x', '/assets/images/scenes/shared/resources/solar_pyrite@0,5x.png');
    this.load.image('slunig@1x', '/assets/images/scenes/shared/resources/slunig.png');
    this.load.image('slunig@0.5x', '/assets/images/scenes/shared/resources/slunig@0,5x.png');
    this.load.image('onyx_blade@1x', '/assets/images/scenes/shared/resources/onyx_blade.png');
    this.load.image('onyx_blade@0.5x', '/assets/images/scenes/shared/resources/onyx_blade@0,5x.png');
    this.load.image('onyther_rock@1x', '/assets/images/scenes/shared/resources/onyther_rock.png');
    this.load.image('onyther_rock@0.5x', '/assets/images/scenes/shared/resources/onyther_rock@0,5x.png');
    this.load.image('obdurium@1x', '/assets/images/scenes/shared/resources/obdurium.png');
    this.load.image('obdurium@0.5x', '/assets/images/scenes/shared/resources/obdurium@0,5x.png');
    this.load.image('molten_ember@1x', '/assets/images/scenes/shared/resources/molten_ember.png');
    this.load.image('molten_ember@0.5x', '/assets/images/scenes/shared/resources/molten_ember@0,5x.png');
    this.load.image('molten_core@1x', '/assets/images/scenes/shared/resources/molten_core.png');
    this.load.image('molten_core@0.5x', '/assets/images/scenes/shared/resources/molten_core@0,5x.png');
    this.load.image('magma_ore@1x', '/assets/images/scenes/shared/resources/magma_ore.png');
    this.load.image('magma_ore@0.5x', '/assets/images/scenes/shared/resources/magma_ore@0,5x.png');
    this.load.image('hydronite_gem@1x', '/assets/images/scenes/shared/resources/hydronite_gem.png');
    this.load.image('hydronite_gem@0.5x', '/assets/images/scenes/shared/resources/hydronite_gem@0,5x.png');
    this.load.image('glacionite@1x', '/assets/images/scenes/shared/resources/glacionite.png');
    this.load.image('glacionite@0.5x', '/assets/images/scenes/shared/resources/glacionite@0,5x.png');
    this.load.image('fluxite_node@1x', '/assets/images/scenes/shared/resources/fluxite_node.png');
    this.load.image('fluxite_node@0.5x', '/assets/images/scenes/shared/resources/fluxite_node@0,5x.png');
    this.load.image('flarite_core@1x', '/assets/images/scenes/shared/resources/flarite_core.png');
    this.load.image('flarite_core@0.5x', '/assets/images/scenes/shared/resources/flarite_core@0,5x.png');
    this.load.image('ferrite_cluster@1x', '/assets/images/scenes/shared/resources/ferrite_cluster.png');
    this.load.image('ferrite_cluster@0.5x', '/assets/images/scenes/shared/resources/ferrite_cluster@0,5x.png');
    this.load.image('dragon_glass@1x', '/assets/images/scenes/shared/resources/dragon_glass.png');
    this.load.image('dragon_glass@0.5x', '/assets/images/scenes/shared/resources/dragon_glass@0,5x.png');
    this.load.image('cryostone_ring@1x', '/assets/images/scenes/shared/resources/cryostone_ring.png');
    this.load.image('cryostone_ring@0.5x', '/assets/images/scenes/shared/resources/cryostone_ring@0,5x.png');
    this.load.image('crylonite@1x', '/assets/images/scenes/shared/resources/crylonite.png');
    this.load.image('crylonite@0.5x', '/assets/images/scenes/shared/resources/crylonite@0,5x.png');
    this.load.image('biomass_core@1x', '/assets/images/scenes/shared/resources/biomass_core.png');
    this.load.image('biomass_core@0.5x', '/assets/images/scenes/shared/resources/biomass_core@0,5x.png');
    this.load.image('bio_nectar@1x', '/assets/images/scenes/shared/resources/bio_nectar.png');
    this.load.image('bio_nectar@0.5x', '/assets/images/scenes/shared/resources/bio_nectar@0,5x.png');
    this.load.image('auracite@1x', '/assets/images/scenes/shared/resources/auracite.png');
    this.load.image('auracite@0.5x', '/assets/images/scenes/shared/resources/auracite@0,5x.png');
    this.load.image('amethyra_cluster@1x', '/assets/images/scenes/shared/resources/amethyra_cluster.png');
    this.load.image('amethyra_cluster@0.5x', '/assets/images/scenes/shared/resources/amethyra_cluster@0,5x.png');
    this.load.image('astro_vapor@1x', '/assets/images/scenes/shared/resources/astro_vapor.png');
    this.load.image('astro_vapor@0.5x', '/assets/images/scenes/shared/resources/astro_vapor@0,5x.png');
    this.load.image('quantum_filament@1x', '/assets/images/scenes/shared/resources/quantum_filament.png');
    this.load.image('quantum_filament@0.5x', '/assets/images/scenes/shared/resources/quantum_filament@0,5x.png');
    this.load.image('starforge_crystal@1x', '/assets/images/scenes/shared/resources/starforge_crystal.png');
    this.load.image('starforge_crystal@0.5x', '/assets/images/scenes/shared/resources/starforge_crystal@0,5x.png');
    this.load.image('void_essence@1x', '/assets/images/scenes/shared/resources/void_essence.png');
    this.load.image('void_essence@0.5x', '/assets/images/scenes/shared/resources/void_essence@0,5x.png');
    this.load.image('osms_coin_part@1x', '/assets/images/scenes/shared/resources/osms_coin_part.png');
    this.load.image('osms_coin_part@0.5x', '/assets/images/scenes/shared/resources/osms_coin_part@0,5x.png');

    this.load.image('energy_matrix@1x', '/assets/images/scenes/shared/components/energy_matrix.png');
    this.load.image('energy_matrix@0.5x', '/assets/images/scenes/shared/components/energy_matrix@0,5x.png');
    this.load.image('kinetic_amplifier@1x', '/assets/images/scenes/shared/components/kinetic_amplifier.png');
    this.load.image('kinetic_amplifier@0.5x', '/assets/images/scenes/shared/components/kinetic_amplifier@0,5x.png');
    this.load.image('radiation_shielding@1x', '/assets/images/scenes/shared/components/radiation_shielding.png');
    this.load.image('radiation_shielding@0.5x', '/assets/images/scenes/shared/components/radiation_shielding@0,5x.png');
    this.load.image('pulse_emitter@1x', '/assets/images/scenes/shared/components/pulse_emitter.png');
    this.load.image('pulse_emitter@0.5x', '/assets/images/scenes/shared/components/pulse_emitter@0,5x.png');
    this.load.image('overcharge_coil@1x', '/assets/images/scenes/shared/components/overcharge_coil.png');
    this.load.image('overcharge_coil@0.5x', '/assets/images/scenes/shared/components/overcharge_coil@0,5x.png');
    this.load.image('stellar_core@1x', '/assets/images/scenes/shared/components/stellar_core.png');
    this.load.image('stellar_core@0.5x', '/assets/images/scenes/shared/components/stellar_core@0,5x.png');
    this.load.image('quantum_capacitor@1x', '/assets/images/scenes/shared/components/quantum_capacitor.png');
    this.load.image('quantum_capacitor@0.5x', '/assets/images/scenes/shared/components/quantum_capacitor@0,5x.png');
    this.load.image('shield_capacitor@1x', '/assets/images/scenes/shared/components/shield_capacitor.png');
    this.load.image('shield_capacitor@0.5x', '/assets/images/scenes/shared/components/shield_capacitor@0,5x.png');
    this.load.image('energy_barrier@1x', '/assets/images/scenes/shared/components/energy_barrier.png');
    this.load.image('energy_barrier@0.5x', '/assets/images/scenes/shared/components/energy_barrier@0,5x.png');
    this.load.image('graviton_emitter@1x', '/assets/images/scenes/shared/components/graviton_emitter.png');
    this.load.image('graviton_emitter@0.5x', '/assets/images/scenes/shared/components/graviton_emitter@0,5x.png');
    this.load.image('plasma_deflector@1x', '/assets/images/scenes/shared/components/plasma_deflector.png');
    this.load.image('plasma_deflector@0.5x', '/assets/images/scenes/shared/components/plasma_deflector@0,5x.png');
    this.load.image('bio_shield_core@1x', '/assets/images/scenes/shared/components/bio_shield_core.png');
    this.load.image('bio_shield_core@0.5x', '/assets/images/scenes/shared/components/bio_shield_core@0,5x.png');
    this.load.image('armor_plating@1x', '/assets/images/scenes/shared/components/armor_plating.png');
    this.load.image('armor_plating@0.5x', '/assets/images/scenes/shared/components/armor_plating@0,5x.png');
    this.load.image('reinforced_alloy@1x', '/assets/images/scenes/shared/components/reinforced_alloy.png');
    this.load.image('reinforced_alloy@0.5x', '/assets/images/scenes/shared/components/reinforced_alloy@0,5x.png');
    this.load.image('kinetic_dampener@1x', '/assets/images/scenes/shared/components/kinetic_dampener.png');
    this.load.image('kinetic_dampener@0.5x', '/assets/images/scenes/shared/components/kinetic_dampener@0,5x.png');
    this.load.image('nano_repair_matrix@1x', '/assets/images/scenes/shared/components/nano_repair_matrix.png');
    this.load.image('nano_repair_matrix@0.5x', '/assets/images/scenes/shared/components/nano_repair_matrix@0,5x.png');
    this.load.image('quantum_armor_core@1x', '/assets/images/scenes/shared/components/quantum_armor_core.png');
    this.load.image('quantum_armor_core@0.5x', '/assets/images/scenes/shared/components/quantum_armor_core@0,5x.png');
    this.load.image('thruster_core@1x', '/assets/images/scenes/shared/components/thruster_core.png');
    this.load.image('thruster_core@0.5x', '/assets/images/scenes/shared/components/thruster_core@0,5x.png');
    this.load.image('propulsion_booster@1x', '/assets/images/scenes/shared/components/propulsion_booster.png');
    this.load.image('propulsion_booster@0.5x', '/assets/images/scenes/shared/components/propulsion_booster@0,5x.png');
    this.load.image('warp_coil@1x', '/assets/images/scenes/shared/components/warp_coil.png');
    this.load.image('warp_coil@0.5x', '/assets/images/scenes/shared/components/warp_coil@0,5x.png');
    this.load.image('plasma_thruster@1x', '/assets/images/scenes/shared/components/plasma_thruster.png');
    this.load.image('plasma_thruster@0.5x', '/assets/images/scenes/shared/components/plasma_thruster@0,5x.png');
    this.load.image('quantum_drive_core@1x', '/assets/images/scenes/shared/components/quantum_drive_core.png');
    this.load.image('quantum_drive_core@0.5x', '/assets/images/scenes/shared/components/quantum_drive_core@0,5x.png');
    this.load.image('sensor_array@1x', '/assets/images/scenes/shared/components/sensor_array.png');
    this.load.image('sensor_array@0.5x', '/assets/images/scenes/shared/components/sensor_array@0,5x.png');
    this.load.image('stabilizer_node@1x', '/assets/images/scenes/shared/components/stabilizer_node.png');
    this.load.image('stabilizer_node@0.5x', '/assets/images/scenes/shared/components/stabilizer_node@0,5x.png');
    this.load.image('plasma_amplifier@1x', '/assets/images/scenes/shared/components/plasma_amplifier.png');
    this.load.image('plasma_amplifier@0.5x', '/assets/images/scenes/shared/components/plasma_amplifier@0,5x.png');
    this.load.image('void_core@1x', '/assets/images/scenes/shared/components/void_core.png');
    this.load.image('void_core@0.5x', '/assets/images/scenes/shared/components/void_core@0,5x.png');
    this.load.image('weapon_memory_bank@1x', '/assets/images/scenes/shared/components/weapon_memory_bank.png');
    this.load.image('weapon_memory_bank@0.5x', '/assets/images/scenes/shared/components/weapon_memory_bank@0,5x.png');
    this.load.image('armor_memory_bank@1x', '/assets/images/scenes/shared/components/armor_memory_bank.png');
    this.load.image('armor_memory_bank@0.5x', '/assets/images/scenes/shared/components/armor_memory_bank@0,5x.png');
    this.load.image('shield_memory_bank@1x', '/assets/images/scenes/shared/components/shield_memory_bank.png');
    this.load.image('shield_memory_bank@0.5x', '/assets/images/scenes/shared/components/shield_memory_bank@0,5x.png');
    this.load.image('engine_memory_bank@1x', '/assets/images/scenes/shared/components/engine_memory_bank.png');
    this.load.image('engine_memory_bank@0.5x', '/assets/images/scenes/shared/components/engine_memory_bank@0,5x.png');

    this.load.image('fuel@1x', '/assets/images/scenes/shared/other/fuel.png');
    this.load.image('fuel@0.5x', '/assets/images/scenes/shared/other/fuel@0,5x.png');
    this.load.image('osms_coin@1x', '/assets/images/scenes/shared/other/osms_coin.png');
    this.load.image('osms_coin@0.75x', '/assets/images/scenes/shared/other/osms_coin@0,75x.png');
    this.load.image('osms_coin@0.5x', '/assets/images/scenes/shared/other/osms_coin@0,5x.png');
    this.load.image('osms_coin@0.25x', '/assets/images/scenes/shared/other/osms_coin@0,25x.png');

    this.load.image('stagestone_texture@1x', '/assets/images/scenes/shared/stagestones/stagestone.png');
    this.load.image('stagestone_texture@0.5x', '/assets/images/scenes/shared/stagestones/stagestone@0,5x.png');

    this.load.image('hull_celestial@1x', '/assets/images/scenes/shared/hulls/hull_celestial.png');
    this.load.image('hull_celestial@0.5x', '/assets/images/scenes/shared/hulls/hull_celestial@0,5x.png');

    const blueprintBaseNames = [
        'bp_pulse_blaster',
        'bp_pulse_shotgun',
        'bp_pulse_piercer',
        'bp_energy_shield',
        'bp_aegis_shield',
        'bp_flux_shield',
        'bp_kinetic_armor',
        'bp_ablative_armor',
        'bp_reactive_armor',
        'bp_ion_thruster'
    ];
    const blueprintScales = ['1x', '0.75x', '0.5x'];

    blueprintBaseNames.forEach(baseName => {
        blueprintScales.forEach(scale => {
            this.load.image(
                `${baseName}@${scale}`,
                `/assets/images/scenes/shared/blueprints/${baseName}@${scale}.png`
            );
        });
    });

    this.graphics = this.add.graphics();
}