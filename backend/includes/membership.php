<?php
// Plans (the subscription part of the DPRate business model) and profile pictures.
// This is a demonstration: changing plan never takes a payment.
// The rules live here, on the server, so a player cannot unlock a paid avatar from the browser.

const PLANS = [
    'standard' => [
        'name' => 'Standard',
        'price' => 0.0,
        'ads' => true,
        'perks' => [
            'Rate and review any game',
            'Keep a favourites list',
            '8 profile pictures',
        ],
    ],
    'silver' => [
        'name' => 'Silver',
        'price' => 2.99,
        'ads' => false,
        'perks' => [
            'Everything in Standard',
            'No ads',
            'Silver badge on your reviews',
            '4 extra profile pictures',
        ],
    ],
    'gold' => [
        'name' => 'Gold',
        'price' => 5.99,
        'ads' => false,
        'perks' => [
            'Everything in Silver',
            'Gold badge on your reviews',
            'Your reviews highlighted on game pages',
            '4 Gold-only profile pictures',
        ],
    ],
];

// Profile pictures by the plan that unlocks them. Higher plans get the lower plans' pictures too.
const AVATARS = [
    'standard' => ['controller', 'joystick', 'sword', 'shield', 'potion', 'ghost', 'rocket', 'heart'],
    'silver' => ['wizard', 'knight', 'robot', 'alien'],
    'gold' => ['crown', 'gem', 'trophy', 'medal'],
];

const PLAN_ORDER = ['standard', 'silver', 'gold'];

function plan_exists(string $plan): bool
{
    return array_key_exists($plan, PLANS);
}

// Every avatar the plan can use, e.g. Silver = Standard + Silver pictures.
function avatars_for_plan(string $plan): array
{
    $level = array_search($plan, PLAN_ORDER, true);
    $level = $level === false ? 0 : $level;

    $avatars = [];
    foreach (array_slice(PLAN_ORDER, 0, $level + 1) as $tier) {
        $avatars = array_merge($avatars, AVATARS[$tier]);
    }
    return $avatars;
}

function avatar_exists(string $avatar): bool
{
    return in_array($avatar, avatars_for_plan('gold'), true);
}

function avatar_allowed(string $avatar, string $plan): bool
{
    return in_array($avatar, avatars_for_plan($plan), true);
}

// The plans as JSON for the Plans page (single source of truth for names, prices and perks).
function plans_for_api(): array
{
    $list = [];
    foreach (PLAN_ORDER as $id) {
        $plan = PLANS[$id];
        $list[] = [
            'id' => $id,
            'name' => $plan['name'],
            'price' => $plan['price'],
            'ads' => $plan['ads'],
            'perks' => $plan['perks'],
            'avatars' => AVATARS[$id],
        ];
    }
    return $list;
}
