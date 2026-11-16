<?php
// GET /api/plans.php -> the Standard, Silver and Gold plans with prices (AUD per month),
// perks and the profile pictures each one unlocks. Used by the Plans page and the Account page.
require __DIR__ . '/../../includes/bootstrap.php';

require_method('GET');

json_response(['success' => true, 'currency' => 'AUD', 'plans' => plans_for_api()]);
