<?php

use Espo\Core\Container;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Config\ConfigWriter;
use Espo\ORM\EntityManager;

/**
 * Lucid succède au thème Arc : le thème par défaut, les préférences des utilisateurs et les
 * portails qui utilisaient « Arc » passent à « Lucid », pour que personne ne retombe sur le
 * thème d'EspoCRM après le changement de nom.
 */
class AfterInstall
{
    private const OLD_THEME = 'Arc';
    private const NEW_THEME = 'Lucid';

    public function run(Container $container): void
    {
        $config = $container->getByClass(Config::class);

        if ($config->get('theme') === self::OLD_THEME) {
            $configWriter = $container->getByClass(InjectableFactory::class)->create(ConfigWriter::class);
            $configWriter->set('theme', self::NEW_THEME);
            $configWriter->save();
        }

        $entityManager = $container->getByClass(EntityManager::class);

        $users = $entityManager->getRDBRepository('User')
            ->select(['id'])
            ->find();

        foreach ($users as $user) {
            $preferences = $entityManager->getEntityById('Preferences', $user->getId());

            if ($preferences && $preferences->get('theme') === self::OLD_THEME) {
                $preferences->set('theme', self::NEW_THEME);
                $entityManager->saveEntity($preferences);
            }
        }

        $portals = $entityManager->getRDBRepository('Portal')
            ->where(['theme' => self::OLD_THEME])
            ->find();

        foreach ($portals as $portal) {
            $portal->set('theme', self::NEW_THEME);
            $entityManager->saveEntity($portal);
        }
    }
}
